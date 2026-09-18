const { Fournisseur, Product } = require('../models');

// GET ALL: Récupérer tous les fournisseurs avec leurs produits associés
exports.getAllFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.findAll({
      include: [{
        model: Product,
        attributes: ['id', 'nom', 'prix_vente', 'quantite']
      }]
    });
    res.status(200).json(fournisseurs);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des fournisseurs", error: error.message });
  }
};

// GET BY ID: Récupérer un fournisseur par son ID avec ses produits
exports.getFournisseurById = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByPk(req.params.id, {
      include: [{
        model: Product,
        attributes: ['id', 'nom', 'prix_vente', 'quantite']
      }]
    });
    if (!fournisseur) return res.status(404).json({ message: "Fournisseur non trouvé" });
    res.status(200).json(fournisseur);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE: Ajouter un fournisseur
exports.createFournisseur = async (req, res) => {
  try {
    const { nom, contact, telephone, adresse } = req.body;
    const newFournisseur = await Fournisseur.create({ nom, contact, telephone, adresse });
    res.status(201).json({ message: "Fournisseur créé avec succès", fournisseur: newFournisseur });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création du fournisseur", error: error.message });
  }
};

// UPDATE: Modifier un fournisseur
exports.updateFournisseur = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Fournisseur.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ message: "Fournisseur non trouvé" });

    const updatedFournisseur = await Fournisseur.findByPk(id);
    res.status(200).json({ message: "Fournisseur mis à jour avec succès", fournisseur: updatedFournisseur });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE: Supprimer un fournisseur
exports.deleteFournisseur = async (req, res) => {
  try {
    const deleted = await Fournisseur.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Fournisseur non trouvé" });
    res.status(200).json({ message: "Fournisseur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};