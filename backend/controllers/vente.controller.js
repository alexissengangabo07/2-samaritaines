const { Vente, DetailVente, Product, User, Category, UniteQte, sequelize } = require('../models');

// Jointures associées à la vente (via DetailVente)
const venteIncludes = [
  {
    model: DetailVente,
    as: 'items', // Supprimez 'as' si vous n'avez pas défini d'alias dans vos associations
    attributes: ['id', 'quantite', 'prix_unitaire', 'total_ligne'],
    include: [
      {
        model: Product, // ou Produit selon le nom de votre modèle
        as: 'produit',
        attributes: ['id', 'nom', 'prix_achat', 'prix_vente'],
        include: [
          { model: Category, attributes: ['nom'] },
          { model: UniteQte, attributes: ['label'] }
        ]
      }
    ]
  },
  {
    model: User,
    as: 'vendeur',
    attributes: ['id', 'name', 'email', 'role']
  }
];

// READ: Obtenir toutes les ventes avec jointures
exports.getAllVentes = async (req, res) => {
  try {
    const ventes = await Vente.findAll({
      include: venteIncludes,
      order: [['dateVente', 'DESC']] // Tri par date récente
    });

    res.status(200).json(ventes);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des ventes",
      error: error.message
    });
  }
};

// READ: Obtenir une vente par ID
exports.getVenteById = async (req, res) => {
  try {
    const vente = await Vente.findByPk(req.params.id, { include: venteIncludes });
    if (!vente) return res.status(404).json({ message: "Vente non trouvée" });
    res.status(200).json(vente);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE: Enregistrer une vente (+ mise à jour du stock produit)
exports.createVente = async (req, res) => {
  // Transaction managée
  const transaction = await sequelize.transaction();

  try {
    console.log(req.body)
    const { nom_client, items, user_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "La vente doit contenir au moins un produit." });
    }

    let totalFacture = 0;
    const detailsAInserer = [];

    // 1. Vérification des stocks et préparation des lignes de vente
    for (const item of items) {
      const produit = await Product.findByPk(item.id_produit, { transaction });

      if (!produit) {
        await transaction.rollback();
        return res.status(404).json({ message: `Produit ID ${item.id_produit} non trouvé.` });
      }

      if (produit.quantite < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour le produit ${produit.nom}. En stock: ${produit.quantite}, Demandé: ${item.quantite}`
        });
      }

      const prixUnitaire = produit.prix_vente;
      const totalLigne = prixUnitaire * item.quantite;
      totalFacture += totalLigne;

      // Mettre à jour le stock du produit
      await produit.update(
        { quantite: produit.quantite - item.quantite },
        { transaction }
      );

      detailsAInserer.push({
        produit_id: item.id_produit,
        quantite: item.quantite,
        prix_unitaire: prixUnitaire,
        total_ligne: totalLigne
      });
    }

    // 3. Créer l'entête de la vente
    const nouvelleVente = await Vente.create({
      nom_client: nom_client || 'Anonyme',
      total: totalFacture,
      user_id: user_id || req.user?.id // id récupéré depuis le token JWT ou le body
    }, { transaction });

    // 4. Associer la facture créée à chaque ligne
    const detailsAvecVenteId = detailsAInserer.map(detail => ({
      ...detail,
      vente_id: nouvelleVente.id
    }));

    // 5. Insertion groupée des éléments de la vente
    await DetailVente.bulkCreate(detailsAvecVenteId, { transaction });

    // Validation finale de la transaction
    await transaction.commit();

    // 6. Récupérer la vente complète avec ses détails pour la réponse
    const venteComplete = await Vente.findByPk(nouvelleVente.id, {
      include: [
        {
          model: DetailVente,
          as: 'items',
          include: [{ model: Product, as: 'produit', attributes: ['id', 'nom'] }]
        }
      ]
    });

    res.status(201).json({
      message: "Vente enregistrée avec succès",
      vente: venteComplete
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur création vente :", error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement de la vente",
      error: error.message
    });
  }
};

// DELETE: Annuler/Supprimer une vente (+ réajustement du stock)
exports.deleteVente = async (req, res) => {
  try {
    const vente = await Vente.findByPk(req.params.id);
    if (!vente) return res.status(404).json({ message: "Vente non trouvée" });

    // Restituer le stock au produit
    await Product.increment('quantite', { by: vente.quantite, where: { id: vente.id_produit } });

    await vente.destroy();
    res.status(200).json({ message: "Vente annulée et stock réajusté" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'annulation", error: error.message });
  }
}