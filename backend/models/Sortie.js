const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sortie = sequelize.define('Sortie', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    service_beneficiaire: {
        type: DataTypes.STRING,
        allowNull: false
    },
    motif: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dateSortie: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'sorties',
    timestamps: true
});

module.exports = Sortie;