const { Sortie, SortieItem, Product, User, sequelize } = require('../models');

/**
 * Créer une nouvelle sortie interne (multi-produits)
 * POST /api/sorties
 */
exports.createSortie = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, service_beneficiaire, motif } = req.body;
    const user_id = req.user?.id || req.body.user_id; // ID de l'agent connecté via JWT ou transmis

    // 1. Validation de base
    if (!service_beneficiaire || !service_beneficiaire.trim()) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Le nom du service bénéficiaire est obligatoire.' 
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: 'Veuillez sélectionner au moins un produit pour la sortie.' 
      });
    }

    // 2. Vérification de l'existence et de la disponibilité du stock pour chaque produit
    for (const item of items) {
      const { id_produit, quantite } = item;
      const qtyOut = parseInt(quantite, 10);

      if (!id_produit || isNaN(qtyOut) || qtyOut <= 0) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: 'Quantité ou identifiant de produit invalide.' 
        });
      }

      const produit = await Product.findByPk(id_produit, { transaction });

      if (!produit) {
        await transaction.rollback();
        return res.status(404).json({ 
          message: `Le produit avec l'ID ${id_produit} n'existe pas.` 
        });
      }

      if (produit.quantite < qtyOut) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Stock insuffisant pour "${produit.nom}". En stock: ${produit.quantite}, Demandé: ${qtyOut}` 
        });
      }
    }

    // 3. Création de l'en-tête de la sortie
    const nouvelleSortie = await Sortie.create({
      service_beneficiaire: service_beneficiaire.trim(),
      motif: motif ? motif.trim() : null,
      user_id
    }, { transaction });

    // 4. Création des lignes de détails et décrémentation des stocks
    for (const item of items) {
      const { id_produit, quantite } = item;
      const qtyOut = parseInt(quantite, 10);

      // Insertion dans sortie_items
      await SortieItem.create({
        sortie_id: nouvelleSortie.id,
        produit_id: id_produit,
        quantite: qtyOut
      }, { transaction });

      // Décrémentation du stock du produit
      await Product.decrement('quantite', {
        by: qtyOut,
        where: { id: id_produit },
        transaction
      });
    }

    // Validation définitive de la transaction
    await transaction.commit();

    // 5. Récupération de la sortie avec ses associations pour la réponse
    const sortieComplete = await Sortie.findByPk(nouvelleSortie.id, {
      include: [
        {
          model: SortieItem,
          as: 'items',
          include: [{ model: Product, as: 'produit', attributes: ['id', 'nom', 'code_barre'] }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.status(201).json({
      message: 'Sortie interne enregistrée avec succès.',
      sortie: sortieComplete
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Erreur lors de la création de la sortie interne :', error);
    return res.status(500).json({ 
      message: 'Erreur serveur lors de la création de la sortie interne.',
      error: error.message 
    });
  }
};

/**
 * Obtenir toutes les sorties internes enregistrées
 * GET /api/sorties
 */
exports.getAllSorties = async (req, res) => {
  try {
    const sorties = await Sortie.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: SortieItem,
          as: 'items',
          include: [{ model: Product, as: 'produit', attributes: ['id', 'nom', 'code_barre', 'prix_vente'] }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      count: sorties.length,
      data: sorties
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sorties :', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la récupération des sorties.',
      error: error.message
    });
  }
};

/**
 * Obtenir les détails d'une sortie spécifique
 * GET /api/sorties/:id
 */
exports.getSortieById = async (req, res) => {
  try {
    const { id } = req.params;

    const sortie = await Sortie.findByPk(id, {
      include: [
        {
          model: SortieItem,
          as: 'items',
          include: [{ model: Product, as: 'produit' }]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!sortie) {
      return res.status(404).json({ message: 'Sortie non trouvée.' });
    }

    return res.status(200).json({ success: true, data: sortie });
  } catch (error) {
    console.error('Erreur lors de la récupération de la sortie :', error);
    return res.status(500).json({
      message: 'Erreur serveur lors de la récupération de la sortie.',
      error: error.message
    });
  }
};

/**
 * Obtenir des statistiques / calculs sur les sorties internes
 * GET /api/sorties/stats/summary
 */
exports.getSortieStats = async (req, res) => {
  try {
    // Total des articles distribués en consommation interne
    const totalArticlesSortis = await SortieItem.sum('quantite') || 0;

    // Nombre total de demandes/opérations de sorties
    const totalOperations = await Sortie.count();

    // Nombre total d'unités sorties regroupé par service
    const parService = await Sortie.findAll({
      attributes: [
        'service_beneficiaire',
        [sequelize.fn('COUNT', sequelize.col('Sortie.id')), 'nombre_demandes']
      ],
      group: ['service_beneficiaire'],
      raw: true
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalArticlesSortis,
        totalOperations,
        frequenceParService: parService
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques des sorties :', error);
    return res.status(500).json({
      message: 'Erreur serveur lors des calculs statistiques.',
      error: error.message
    });
  }
};