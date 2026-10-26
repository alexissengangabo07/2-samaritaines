// models/Vente.js (ou Vente_2.js)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Vente = sequelize.define(
  "Vente",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom_client: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Client comptant",
    },
    total: { type: DataTypes.DOUBLE, allowNull: false },
    dateVente: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dateMiseAJour: { type: DataTypes.DATE, allowNull: true },
    type_vente: {
      type: DataTypes.ENUM("comptant", "abonne"),
      allowNull: false,
      defaultValue: "comptant",
    },
    abonne_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dependant_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Rempli si l'achat est fait par un dépendant
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  { tableName: "vente", timestamps: false },
);

module.exports = Vente;
