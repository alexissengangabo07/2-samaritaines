const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fournisseur = sequelize.define('Fournisseur', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom: { type: DataTypes.STRING(255), allowNull: false },
  contact: { type: DataTypes.STRING(255) },
  telephone: { type: DataTypes.STRING(255) },
  adresse: { type: DataTypes.TEXT }
}, { tableName: 'fournisseurs', timestamps: false });

module.exports = Fournisseur;