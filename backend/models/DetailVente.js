const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetailVente = sequelize.define('DetailVente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vente_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    produit_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    prix_unitaire: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    total_ligne: {
        type: DataTypes.DOUBLE,
        allowNull: false
    }
}, {
    tableName: 'details_vente',
    timestamps: false
});

module.exports = DetailVente;