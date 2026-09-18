const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UniteQte = sequelize.define('UniteQte', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING(20), allowNull: false }
}, { tableName: 'unite_qte', timestamps: false });

module.exports = UniteQte;