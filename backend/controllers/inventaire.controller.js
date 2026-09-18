const { sequelize, Inventaire, DetailInventaire, Product, User } = require('../models');

// GET : Liste de tous les inventaires (Historique)
exports.getAllInventaires = async (req, res) => {
    try {
        const inventaires = await Inventaire.findAll({
            include: [
                { model: User, as: 'utilisateur', attributes: ['id', 'name', 'email'] },
                { model: DetailInventaire, as: 'items' }
            ],
            order: [['date_inventaire', 'DESC']]
        });
        res.json(inventaires);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération des inventaires" });
    }
};

// GET : Récupérer un inventaire par son ID avec les détails des produits
exports.getInventaireById = async (req, res) => {
    try {
        const inventaire = await Inventaire.findByPk(req.params.id, {
            include: [
                { model: User, as: 'utilisateur', attributes: ['id', 'name'] },
                {
                    model: DetailInventaire,
                    as: 'items',
                    include: [{ model: Product, as: 'produit', attributes: ['id', 'nom', 'prix_vente'] }]
                }
            ]
        });

        if (!inventaire) {
            return res.status(404).json({ message: "Inventaire introuvable" });
        }

        res.json(inventaire);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du détail de l'inventaire" });
    }
};

// POST : Créer un nouvel inventaire et mettre à jour le stock
exports.createInventaire = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { reference, utilisateur_id, observations, items } = req.body;

        // 1. Enregistrer l'en-tête de l'inventaire
        const nouvelInventaire = await Inventaire.create({
            reference,
            utilisateur_id,
            observations,
            statut: 'valide'
        }, { transaction: t });

        // 2. Traiter chaque ligne d'article
        for (const item of items) {
            // Créer la ligne de détail
            await DetailInventaire.create({
                inventaire_id: nouvelInventaire.id,
                produit_id: item.produit_id,
                quantite_en_stock: item.quantite_en_stock,
                quantite_constatee: item.quantite_constatee
            }, { transaction: t });

            // Mettre à jour la quantité en stock du produit
            await Product.update(
                { quantite: item.quantite_constatee },
                { where: { id: item.produit_id }, transaction: t }
            );
        }

        // Valider la transaction
        await t.commit();
        res.status(201).json({ message: "Inventaire enregistré et stock mis à jour avec succès !", inventaire: nouvelInventaire });
    } catch (error) {
        // Annuler les modifications en cas d'erreur
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la création de l'inventaire" });
    }
};