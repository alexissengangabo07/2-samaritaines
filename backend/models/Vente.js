const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vente = sequelize.define('Vente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom_client: {
    type: DataTypes.STRING,
    allowNull: true, // Ou false si obligatoire
    defaultValue: 'Client comptant'
  },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  dateVente: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, { tableName: 'vente', timestamps: false });

module.exports = Vente;