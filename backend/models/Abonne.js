const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Abonne = sequelize.define('Abonne', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entreprise_id: {
    type: DataTypes.INTEGER,
    allowNull: true // null = abonné individuel, sans entreprise ni réduction
  },
  actif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  dateCreation: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'abonnes',
  timestamps: false
});

module.exports = Abonne;