const User = require('./User');
const Category = require('./Category');
const Fournisseur = require('./Fournisseur');
const UniteQte = require('./UniteQte');
const Product = require('./Product');
const Approvisionnement = require('./Approvisionnement');
const Vente = require('./Vente');
const Inventaire = require('./Inventaire');
const DetailInventaire = require('./DetailInventaire');
const sequelize = require('../config/database');

// Relations Product
Category.hasMany(Product, { foreignKey: 'categorie_id' });
Product.belongsTo(Category, { foreignKey: 'categorie_id' });

Fournisseur.hasMany(Product, { foreignKey: 'fournisseur_id' });
Product.belongsTo(Fournisseur, { foreignKey: 'fournisseur_id' });

UniteQte.hasMany(Product, { foreignKey: 'id_unite' });
Product.belongsTo(UniteQte, { foreignKey: 'id_unite' });

// Relations Approvisionnement
Product.hasMany(Approvisionnement, { foreignKey: 'id_produit' });
Approvisionnement.belongsTo(Product, { foreignKey: 'id_produit' });

User.hasMany(Approvisionnement, { foreignKey: 'id_utilisateur' });
Approvisionnement.belongsTo(User, { foreignKey: 'id_utilisateur' });

// Relations Vente
Product.hasMany(Vente, { foreignKey: 'id_produit' });
Vente.belongsTo(Product, { foreignKey: 'id_produit' });

User.hasMany(Vente, { foreignKey: 'user_id' });
Vente.belongsTo(User, { foreignKey: 'user_id' });

// Relations Inventaire <-> DetailInventaire
Inventaire.hasMany(DetailInventaire, { foreignKey: 'inventaire_id', as: 'items', onDelete: 'CASCADE' });
DetailInventaire.belongsTo(Inventaire, { foreignKey: 'inventaire_id' });

// Relations Produit <-> DetailInventaire
Product.hasMany(DetailInventaire, { foreignKey: 'produit_id' });
DetailInventaire.belongsTo(Product, { foreignKey: 'produit_id', as: 'produit' });

// Relations Utilisateur <-> Inventaire
User.hasMany(Inventaire, { foreignKey: 'utilisateur_id' });
Inventaire.belongsTo(User, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

module.exports = { User, Category, Fournisseur, UniteQte, Product, Approvisionnement, Vente, Inventaire, DetailInventaire, sequelize };