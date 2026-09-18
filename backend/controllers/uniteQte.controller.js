const { UniteQte, Product } = require('../models');

// GET ALL: Récupérer toutes les unités de quantité avec leurs produits
exports.getAllUnites = async (req, res) => {
  try {
    const unites = await UniteQte.findAll({
      include: [{
        model: Product,
        attributes: ['id', 'nom', 'quantite']
      }]
    });
    res.status(200).json(unites);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des unités", error: error.message });
  }
};

// GET BY ID: Récupérer une unité par ID
exports.getUniteById = async (req, res) => {
  try {
    const unite = await UniteQte.findByPk(req.params.id, {
      include: [{
        model: Product,
        attributes: ['id', 'nom', 'quantite']
      }]
    });
    if (!unite) return res.status(404).json({ message: "Unité non trouvée" });
    res.status(200).json(unite);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE: Ajouter une unité de quantité
exports.createUnite = async (req, res) => {
  console.log(req.body)
  try {
    const { label } = req.body;
    const newUnite = await UniteQte.create({ label });
    res.status(201).json({ message: "Unité créée avec succès", unite: newUnite });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création de l'unité", error: error.message });
  }
};

// UPDATE: Modifier une unité
exports.updateUnite = async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const [updated] = await UniteQte.update({ label }, { where: { id } });
    if (!updated) return res.status(404).json({ message: "Unité non trouvée" });

    res.status(200).json({ message: "Unité mise à jour avec succès" });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE: Supprimer une unité
exports.deleteUnite = async (req, res) => {
  try {
    console.log(req.params.id)
    const deleted = await UniteQte.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Unité non trouvée" });
    res.status(200).json({ message: "Unité supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};