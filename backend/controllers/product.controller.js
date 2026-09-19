const { Product, Category, Fournisseur, UniteQte } = require('../models');

// Jointure réutilisable pour récupérer toutes les relations associées à un produit
const productIncludes = [
  { model: Category, attributes: ['id', 'nom'] },
  { model: Fournisseur, attributes: ['id', 'nom', 'contact', 'telephone'] },
  { model: UniteQte, attributes: ['id', 'label'] }
];

// READ: Obtenir tous les produits avec leurs relations (Jointure)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: productIncludes
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits", error: error.message });
  }
};

// READ: Obtenir un produit par ID avec ses relations
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: productIncludes
    });
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du produit", error: error.message });
  }
};

// CREATE: Ajouter un nouveau produit
exports.createProduct = async (req, res) => {
  try {
    console.log(req.body);
    const { nom, prix_vente, quantite, stock_alerte, description, dateExpiration, id_unite, categorie_id, fournisseur_id } = req.body;

    // Vérification explicite (optionnelle mais plus propre)
    const existingProduct = await Product.findOne({ where: { nom } });
    if (existingProduct) {
      return res.status(400).json({ message: "Un produit avec ce nom me existe déjà." });
    }
    const newProduct = await Product.create({
      nom,
      prix_vente,
      quantite: quantite || 0,
      stock_alerte,
      description,
      dateExpiration,
      id_unite,
      categorie_id,
      fournisseur_id
    });

    res.status(201).json({ message: "Produit créé avec succès", product: newProduct });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création du produit", error: error.message });
    console.log(error.message)
  }
};

// UPDATE: Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Product.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ message: "Produit non trouvé" });

    const updatedProduct = await Product.findByPk(id, { include: productIncludes });
    res.status(200).json({ message: "Produit mis à jour avec succès", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE: Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Produit non trouvé" });
    res.status(200).json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};