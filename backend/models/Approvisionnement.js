const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Approvisionnement = sequelize.define('Approvisionnement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantite: { type: DataTypes.INTEGER, allowNull: false },
  prix_achat: { type: DataTypes.DOUBLE, allowNull: false },
  date_expiration: { type: DataTypes.DATEONLY },
  numero_lot: { type: DataTypes.STRING(20) },
  dateApprovisionnement: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, { tableName: 'approvisionnement', timestamps: false });

module.exports = Approvisionnement;