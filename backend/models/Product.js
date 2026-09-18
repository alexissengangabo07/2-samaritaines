const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, unique: {
      msg: "Un produit avec ce nom existe déjà."
    } },
  nom: { type: DataTypes.STRING(255), allowNull: false },
  prix_achat: { type: DataTypes.DOUBLE, allowNull: false },
  prix_vente: { type: DataTypes.DOUBLE, allowNull: false },
  quantite: { type: DataTypes.INTEGER, defaultValue: 0 },
  description: { type: DataTypes.TEXT },
  dateExpiration: { type: DataTypes.DATE }
}, { tableName: 'products', timestamps: true });

module.exports = Product;