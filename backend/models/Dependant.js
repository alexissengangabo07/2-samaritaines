// models/Dependant.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Dependant = sequelize.define(
  "Dependant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    abonne_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lien: {
      type: DataTypes.STRING, // ex: 'Épouse', 'Fils', 'Fille', etc.
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actif: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "dependants",
    timestamps: false,
  },
);

module.exports = Dependant;
