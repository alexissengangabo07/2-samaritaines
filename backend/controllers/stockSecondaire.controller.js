const {
  StockSecondaire,
  Product,
  UniteQte, // <-- Assurez-vous d'importer UniteQte
  Vente,
  DetailVente,
  sequelize,
} = require("../models");

// GET /api/stock-secondaire — Récupérer l'état du stock secondaire
exports.getAllStockSecondaire = async (req, res) => {
  try {
    const stock = await StockSecondaire.findAll({
      include: [
        {
          model: Product,
          as: "produit",
          attributes: ["id", "nom", "prix_vente", "prix_achat"],
          include: [
            {
              model: UniteQte,
              attributes: ["id", "label"], // <-- Ajout de la relation vers l'unité
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(stock);
  } catch (error) {
    console.error("Erreur récupération stock secondaire:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération du stock secondaire",
      error: error.message,
    });
  }
};

// GET /api/stock-secondaire/internes — Lister les factures des patients hospitalisés (type_vente = 'interne')
exports.getFacturesInternes = async (req, res) => {
  try {
    const ventesInternes = await Vente.findAll({
      where: { type_vente: "interne" },
      include: [
        {
          model: DetailVente,
          as: "items",
          include: [
            {
              model: Product,
              as: "produit",
              attributes: ["id", "nom", "prix_vente"],
              include: [
                {
                  model: UniteQte,
                  attributes: ["id", "label"],
                },
              ],
            },
          ],
        },
      ],
      order: [["dateVente", "DESC"]],
    });
    return res.status(200).json(ventesInternes);
  } catch (error) {
    console.error("Erreur récupération factures internes:", error);
    return res.status(500).json({
      message: "Erreur serveur lors de la récupération des factures",
      error: error.message,
    });
  }
};

// POST /api/stock-secondaire/facturer — Admettre et créer la première facture du patient
exports.facturerInterne = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { patient_nom, chambre, items, user_id } = req.body;

    if (!patient_nom || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Informations invalides (Nom du patient et articles requis).",
      });
    }

    let totalFacture = 0;
    const detailsAInserer = [];

    for (const item of items) {
      const stockSec = await StockSecondaire.findByPk(item.stock_sec_id, {
        include: [{ model: Product, as: "produit" }],
        transaction,
      });

      if (!stockSec) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Article ID ${item.stock_sec_id} non trouvé dans le stock secondaire.`,
        });
      }

      if (stockSec.quantite < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock secondaire insuffisant pour "${stockSec.produit.nom}". En stock: ${stockSec.quantite}, Demandé: ${item.quantite}`,
        });
      }

      const prixUnitaire = stockSec.produit.prix_vente;
      const totalLigne = prixUnitaire * item.quantite;
      totalFacture += totalLigne;

      // Décrémenter la quantité dans le stock secondaire
      await stockSec.decrement("quantite", { by: item.quantite, transaction });

      detailsAInserer.push({
        produit_id: stockSec.produit_id,
        quantite: item.quantite,
        prix_unitaire: prixUnitaire,
        total_ligne: totalLigne,
      });
    }

    // Créer la facture sous l'étiquette 'interne'
    const nouvelleVente = await Vente.create(
      {
        nom_client: `${patient_nom} (${chambre || "Hospitalisé"})`,
        total: totalFacture,
        user_id: user_id || req.user?.id,
        type_vente: "interne",
      },
      { transaction },
    );

    const detailsAvecVenteId = detailsAInserer.map((d) => ({
      ...d,
      vente_id: nouvelleVente.id,
    }));

    await DetailVente.bulkCreate(detailsAvecVenteId, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: "Admission et facturation enregistrées.",
      vente_id: nouvelleVente.id,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Erreur facturation patient interné:", error);
    return res.status(500).json({
      message: "Erreur lors de la facturation de l'interné",
      error: error.message,
    });
  }
};

// POST /api/stock-secondaire/facturer-plus/:id — Ajouter des consommations quotidiennes (J+1, J+2...)
exports.ajouterArticlesInterne = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Veuillez fournir au moins un médicament à ajouter.",
      });
    }

    const vente = await Vente.findByPk(id, { transaction });
    if (!vente) {
      await transaction.rollback();
      return res.status(404).json({ message: "Facture patient introuvable." });
    }

    let totalAjoute = 0;
    const detailsAInserer = [];

    for (const item of items) {
      const stockSec = await StockSecondaire.findByPk(item.stock_sec_id, {
        include: [{ model: Product, as: "produit" }],
        transaction,
      });

      if (!stockSec) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Article ID ${item.stock_sec_id} non trouvé dans le stock secondaire.`,
        });
      }

      if (stockSec.quantite < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock secondaire insuffisant pour "${stockSec.produit.nom}". En stock: ${stockSec.quantite}, Demandé: ${item.quantite}`,
        });
      }

      const prixUnitaire = stockSec.produit.prix_vente;
      const totalLigne = prixUnitaire * item.quantite;
      totalAjoute += totalLigne;

      // Décrémenter du stock secondaire
      await stockSec.decrement("quantite", { by: item.quantite, transaction });

      detailsAInserer.push({
        vente_id: vente.id,
        produit_id: stockSec.produit_id,
        quantite: item.quantite,
        prix_unitaire: prixUnitaire,
        total_ligne: totalLigne,
      });
    }

    await DetailVente.bulkCreate(detailsAInserer, { transaction });

    // Mettre à jour le montant cumulé de la facture
    await vente.update(
      {
        total: vente.total + totalAjoute,
        dateMiseAJour: new Date(),
      },
      { transaction },
    );

    await transaction.commit();

    const venteMiseAJour = await Vente.findByPk(vente.id, {
      include: [
        {
          model: DetailVente,
          as: "items",
          include: [{ model: Product, as: "produit" }],
        },
      ],
    });

    return res.status(200).json({
      message: "Articles ajoutés avec succès à la facture du patient.",
      vente: venteMiseAJour,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Erreur ajout articles interné:", error);
    return res.status(500).json({
      message: "Erreur lors de l'ajout des articles",
      error: error.message,
    });
  }
};
