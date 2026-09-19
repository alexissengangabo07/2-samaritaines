const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SortieItem = sequelize.define('SortieItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sortie_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    produit_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    }
}, {
    tableName: 'sortie_items',
    timestamps: true
});

module.exports = SortieItem;