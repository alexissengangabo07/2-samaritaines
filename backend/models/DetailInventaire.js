const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetailInventaire = sequelize.define('DetailInventaire', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quantite_en_stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantite_constatee: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ecart: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.quantite_constatee - this.quantite_en_stock;
    },
    set() {
      throw new Error('Ne pas définir directement la valeur de ecart');
    }
  }
}, {
  tableName: 'details_inventaire',
  timestamps: false,
});

module.exports = DetailInventaire;