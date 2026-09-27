const { Vente, DetailVente, Product, User, Category, UniteQte, Abonne, Paiement, Entreprise, sequelize } = require('../models');

// Jointures associées à la vente
const venteIncludes = [
  {
    model: DetailVente,
    as: 'items',
    attributes: ['id', 'quantite', 'prix_unitaire', 'total_ligne'],
    include: [
      {
        model: Product,
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
  },
  {
    model: Abonne,
    as: 'abonne',
    attributes: ['id', 'nom', 'telephone'],
    include: [
      { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'pourcentage_reduction'] }
    ]
  },
  {
    model: Paiement,
    as: 'paiements',
    attributes: ['id', 'montant', 'mode_paiement', 'datePaiement']
  }
];

// --- Utilitaires internes réutilisés dans plusieurs fonctions ---

// Récupère le % de réduction applicable pour un abonné (0 si pas d'entreprise ou pas abonné)
function getReductionAbonne(abonne) {
  if (!abonne || !abonne.entreprise) return 0;
  return abonne.entreprise.pourcentage_reduction || 0;
}

// Calcule le montant déjà payé et le solde restant dû pour une vente
function calculerSolde(vente) {
  const paiements = vente.paiements || [];
  const montantPaye = paiements.reduce((somme, p) => somme + p.montant, 0);
  return {
    montant_paye: montantPaye,
    solde: vente.total - montantPaye
  };
}

// READ: Obtenir toutes les ventes avec jointures
exports.getAllVentes = async (req, res) => {
  try {
    const ventes = await Vente.findAll({
      include: venteIncludes,
      order: [['dateVente', 'DESC']]
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

// CREATE: Enregistrer une vente (comptant ou abonné) + mise à jour du stock
exports.createVente = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { nom_client, items, user_id, type_vente, abonne_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "La vente doit contenir au moins un produit." });
    }

    const typeFinal = type_vente === 'abonne' ? 'abonne' : 'comptant';
    let abonne = null;
    let pourcentageReduction = 0;

    // Si c'est une vente abonné, on valide l'abonné et on récupère la réduction de son entreprise
    if (typeFinal === 'abonne') {
      if (!abonne_id) {
        await transaction.rollback();
        return res.status(400).json({ message: "Veuillez sélectionner un abonné pour une vente à crédit." });
      }

      abonne = await Abonne.findByPk(abonne_id, {
        include: [{ model: Entreprise, as: 'entreprise' }],
        transaction
      });

      if (!abonne || !abonne.actif) {
        await transaction.rollback();
        return res.status(404).json({ message: "Abonné introuvable ou inactif." });
      }

      pourcentageReduction = getReductionAbonne(abonne);
    }

    let totalFacture = 0;
    const detailsAInserer = [];

    // Vérification des stocks et préparation des lignes de vente
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

      // Le prix est toujours recalculé côté serveur (jamais accepté depuis le frontend)
      // pour éviter qu'un client malveillant manipule le prix envoyé à l'API
      const prixBase = produit.prix_vente;
      const prixUnitaire = typeFinal === 'abonne'
        ? Math.round(prixBase * (1 - pourcentageReduction / 100))
        : prixBase;

      const totalLigne = prixUnitaire * item.quantite;
      totalFacture += totalLigne;

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

    // Créer l'entête de la vente
    const nouvelleVente = await Vente.create({
      nom_client: typeFinal === 'abonne' ? abonne.nom : (nom_client || 'Anonyme'),
      total: totalFacture,
      user_id: user_id || req.user?.id,
      type_vente: typeFinal,
      abonne_id: typeFinal === 'abonne' ? abonne.id : null
    }, { transaction });

    // Associer la facture créée à chaque ligne
    const detailsAvecVenteId = detailsAInserer.map(detail => ({
      ...detail,
      vente_id: nouvelleVente.id
    }));

    await DetailVente.bulkCreate(detailsAvecVenteId, { transaction });

    await transaction.commit();

    const venteComplete = await Vente.findByPk(nouvelleVente.id, { include: venteIncludes });

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

// UPDATE: Ajouter un ou plusieurs articles à une vente existante (+ stock + total + date de mise à jour)
exports.addItemsToVente = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Veuillez fournir au moins un produit à ajouter." });
    }

    // On charge la vente avec son abonné + entreprise pour connaître la réduction à appliquer
    const vente = await Vente.findByPk(id, {
      include: [{
        model: Abonne,
        as: 'abonne',
        include: [{ model: Entreprise, as: 'entreprise' }]
      }],
      transaction
    });

    if (!vente) {
      await transaction.rollback();
      return res.status(404).json({ message: "Vente (facture) non trouvée." });
    }

    const pourcentageReduction = vente.type_vente === 'abonne'
      ? getReductionAbonne(vente.abonne)
      : 0;

    let totalAjoute = 0;
    const detailsAInserer = [];

    for (const item of items) {
      const produit = await Product.findByPk(item.id_produit, { transaction });

      if (!produit) {
        await transaction.rollback();
        return res.status(404).json({ message: `Produit ID ${item.id_produit} non trouvé.` });
      }

      if (produit.quantite < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour ${produit.nom}. En stock: ${produit.quantite}, Demandé: ${item.quantite}`
        });
      }

      const prixUnitaire = Math.round(produit.prix_vente * (1 - pourcentageReduction / 100));
      const totalLigne = prixUnitaire * item.quantite;
      totalAjoute += totalLigne;

      await produit.update(
        { quantite: produit.quantite - item.quantite },
        { transaction }
      );

      detailsAInserer.push({
        vente_id: vente.id,
        produit_id: item.id_produit,
        quantite: item.quantite,
        prix_unitaire: prixUnitaire,
        total_ligne: totalLigne
      });
    }

    await DetailVente.bulkCreate(detailsAInserer, { transaction });

    await vente.update(
      {
        total: vente.total + totalAjoute,
        dateMiseAJour: new Date()
      },
      { transaction }
    );

    await transaction.commit();

    const venteMiseAJour = await Vente.findByPk(id, { include: venteIncludes });

    res.status(200).json({
      message: "Article(s) ajouté(s) à la facture avec succès",
      vente: venteMiseAJour
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur ajout article à la vente :", error);
    res.status(500).json({
      message: "Erreur lors de l'ajout de l'article à la facture",
      error: error.message
    });
  }
};

// READ: Liste des ventes à crédit (abonnés) avec leur solde calculé
exports.getVentesCredit = async (req, res) => {
  try {
    const ventes = await Vente.findAll({
      where: { type_vente: 'abonne' },
      include: venteIncludes,
      order: [['dateVente', 'DESC']]
    });

    const result = ventes.map(vente => {
      const { montant_paye, solde } = calculerSolde(vente);
      return {
        ...vente.toJSON(),
        montant_paye,
        solde,
        statut_paiement: montant_paye <= 0 ? 'non_payé' : solde <= 0 ? 'payé' : 'partiel'
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des ventes à crédit",
      error: error.message
    });
  }
};

// CREATE: Enregistrer un paiement (remboursement) sur une facture abonné
exports.addPaiement = async (req, res) => {
  try {
    const { vente_id, montant, mode_paiement } = req.body;

    const montantPaiement = parseFloat(montant);
    if (isNaN(montantPaiement) || montantPaiement <= 0) {
      return res.status(400).json({ message: "Le montant du paiement doit être supérieur à 0." });
    }

    const vente = await Vente.findByPk(vente_id, { include: venteIncludes });
    if (!vente) {
      return res.status(404).json({ message: "Vente non trouvée." });
    }

    if (vente.type_vente !== 'abonne') {
      return res.status(400).json({ message: "Cette vente n'est pas une vente à crédit (abonné)." });
    }

    const { solde } = calculerSolde(vente);

    if (montantPaiement > solde) {
      return res.status(400).json({
        message: `Le montant dépasse le solde restant dû (${solde.toLocaleString()} FC).`
      });
    }

    const paiement = await Paiement.create({
      vente_id,
      montant: montantPaiement,
      mode_paiement: mode_paiement || null
    });

    res.status(201).json({
      message: "Paiement enregistré avec succès",
      paiement,
      solde_restant: solde - montantPaiement
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'enregistrement du paiement",
      error: error.message
    });
  }
};

// DELETE: Annuler/Supprimer une vente (+ réajustement du stock)
exports.deleteVente = async (req, res) => {
  try {
    const vente = await Vente.findByPk(req.params.id, {
      include: [{ model: DetailVente, as: 'items' }]
    });
    if (!vente) return res.status(404).json({ message: "Vente non trouvée" });

    // Restituer le stock pour chaque ligne de la facture (pas seulement un produit unique)
    const transaction = await sequelize.transaction();
    try {
      for (const item of vente.items) {
        await Product.increment('quantite', {
          by: item.quantite,
          where: { id: item.produit_id },
          transaction
        });
      }

      await vente.destroy({ transaction });
      await transaction.commit();

      res.status(200).json({ message: "Vente annulée et stock réajusté" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'annulation", error: error.message });
  }
};