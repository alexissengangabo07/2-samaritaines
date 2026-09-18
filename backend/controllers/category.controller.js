const { Category } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération catégories" });
  }
};

exports.create = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Erreur création catégorie" });
  }
};

exports.update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Catégorie non trouvée" });
    await category.update(req.body);
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Erreur mise à jour catégorie" });
  }
};

exports.delete = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: "Catégorie non trouvée" });
    await category.destroy();
    res.json({ message: "Catégorie supprimée" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression catégorie" });
  }
};
