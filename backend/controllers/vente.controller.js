const { Vente, Product, User, Category, UniteQte } = require('../models');

// Jointures associées à la vente
const venteIncludes = [
  {
    model: Product,
    attributes: ['id', 'nom', 'prix_achat', 'prix_vente'],
    include: [
      { model: Category, attributes: ['nom'] },
      { model: UniteQte, attributes: ['label'] }
    ]
  },
  {
    model: User,
    attributes: ['id', 'name', 'email', 'role']
  }
];

// READ: Obtenir toutes les ventes avec jointures
exports.getAllVentes = async (req, res) => {
  try {
    const ventes = await Vente.findAll({ include: venteIncludes });
    res.status(200).json(ventes);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des ventes", error: error.message });
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
  try {
    const { id_produit, quantite, user_id, dateVente, nom_client } = req.body;

    // Vérifier le stock disponible
    const product = await Product.findByPk(id_produit);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    if (product.quantite < quantite) {
      return res.status(400).json({ message: "Stock insuffisant pour effectuer cette vente" });
    }

    // Créer la vente
    const vente = await Vente.create({
      id_produit,
      quantite,
      user_id,
      dateVente: dateVente || new Date(),
      nom_client: nom_client || 'Client comptant'
    });

    // Diminuer le stock du produit
    await product.decrement('quantite', { by: quantite });

    res.status(201).json({ message: "Vente enregistrée avec succès", vente });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création de la vente", error: error.message });
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
};