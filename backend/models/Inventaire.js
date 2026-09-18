const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Votre instance Sequelize

const Inventaire = sequelize.define('Inventaire', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  reference: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  date_inventaire: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  statut: {
    type: DataTypes.ENUM('en_cours', 'valide', 'annule'),
    defaultValue: 'en_cours',
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'inventaires',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Inventaire;