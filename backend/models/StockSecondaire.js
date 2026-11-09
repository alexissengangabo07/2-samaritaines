// models/StockSecondaire.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StockSecondaire = sequelize.define(
  "StockSecondaire",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    produit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    tableName: "stock_secondaire",
    timestamps: true,
  },
);

module.exports = StockSecondaire;
