const { Approvisionnement, Product, User } = require("../models");

const approIncludes = [
  { model: Product, attributes: ["id", "nom", "prix_vente", "quantite"] },
  { model: User, attributes: ["id", "name", "role"] },
];

// READ: Obtenir tous les approvisionnements
exports.getAllApprovisionnements = async (req, res) => {
  try {
    const appros = await Approvisionnement.findAll({
      include: approIncludes,
      order: [["dateApprovisionnement", "DESC"]],
    });
    res.status(200).json(appros);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur de récupération", error: error.message });
  }
};

// CREATE: Enregistrer un approvisionnement (+ augmentation du stock produit)
exports.createApprovisionnement = async (req, res) => {
  try {
    console.log(req.body);
    const {
      id_produit,
      quantite,
      prix_achat,
      date_expiration,
      numero_lot,
      id_utilisateur,
      dateApprovisionnement,
    } = req.body;

    const product = await Product.findByPk(id_produit);
    if (!product)
      return res.status(404).json({ message: "Produit non trouvé" });

    const newAppro = await Approvisionnement.create({
      id_produit,
      quantite,
      prix_achat,
      date_expiration,
      numero_lot,
      id_utilisateur,
      dateApprovisionnement: dateApprovisionnement || new Date(),
    });

    // 2. Mettre à jour le prix d'achat et augmenter le stock
    const updateData = {};
    if (prix_achat !== undefined && prix_achat !== null) {
      updateData.prix_achat = prix_achat;
    }

    // Mise à jour simultanée de la quantité et du prix d'achat
    await product.increment("quantite", { by: quantite });
    if (Object.keys(updateData).length > 0) {
      await product.update(updateData);
    }

    res.status(201).json({
      message: "Stock réapprovisionné avec succès",
      approvisionnement: newAppro,
    });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors du réapprovisionnement",
      error: error.message,
    });
  }
};

// DELETE: Annuler un approvisionnement
exports.deleteApprovisionnement = async (req, res) => {
  try {
    const appro = await Approvisionnement.findByPk(req.params.id);
    if (!appro)
      return res.status(404).json({ message: "Approvisionnement non trouvé" });

    // Réduire le stock
    await Product.decrement("quantite", {
      by: appro.quantite,
      where: { id: appro.id_produit },
    });

    await appro.destroy();
    res
      .status(200)
      .json({ message: "Approvisionnement supprimé et stock réajusté" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression", error: error.message });
  }
};
