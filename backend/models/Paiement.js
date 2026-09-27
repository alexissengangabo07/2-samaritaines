const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paiement = sequelize.define('Paiement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vente_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  montant: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    validate: {
      min: 0.01 // un paiement doit toujours être strictement positif
    }
  },
  mode_paiement: {
    type: DataTypes.STRING, // ex: 'espece', 'mobile_money', 'virement'
    allowNull: true
  },
  datePaiement: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'paiements',
  timestamps: false
});

module.exports = Paiement;