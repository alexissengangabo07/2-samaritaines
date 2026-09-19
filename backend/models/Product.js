const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, unique: {
      msg: "Un produit avec ce nom existe déjà."
    }
  },
  nom: { type: DataTypes.STRING(255), allowNull: false },
  prix_achat: { type: DataTypes.DOUBLE, allowNull: true },
  prix_vente: { type: DataTypes.DOUBLE, allowNull: false },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  stock_alerte: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5, // Seuil d'alerte par défaut (ajustable par produit)
    validate: {
      min: 0
    }
  },
  description: { type: DataTypes.TEXT },
  dateExpiration: { type: DataTypes.DATE }
}, { tableName: 'products', timestamps: true });

module.exports = Product;