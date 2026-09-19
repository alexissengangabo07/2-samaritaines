const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vente = sequelize.define('Vente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nom_client: {
    type: DataTypes.STRING,
    allowNull: true, // Ou false si obligatoire
    defaultValue: 'Client comptant'
  },
  total: { type: DataTypes.DOUBLE, allowNull: false },
  dateVente: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'vente', timestamps: false });

module.exports = Vente;