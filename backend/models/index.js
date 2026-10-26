const User = require("./User");
const Category = require("./Category");
const Fournisseur = require("./Fournisseur");
const UniteQte = require("./UniteQte");
const Product = require("./Product");
const Approvisionnement = require("./Approvisionnement");
const Vente = require("./Vente");
const DetailVente = require("./DetailVente");
const Inventaire = require("./Inventaire");
const DetailInventaire = require("./DetailInventaire");
const Sortie = require("./Sortie");
const SortieItem = require("./SortieItem");
const Entreprise = require("./Entreprise"); // AJOUT
const Abonne = require("./Abonne"); // AJOUT
const Paiement = require("./Paiement"); // AJOUT
const Dependant = require("./Dependant");
const sequelize = require("../config/database");

// Relations Product
Category.hasMany(Product, { foreignKey: "categorie_id" });
Product.belongsTo(Category, { foreignKey: "categorie_id" });

Fournisseur.hasMany(Product, { foreignKey: "fournisseur_id" });
Product.belongsTo(Fournisseur, { foreignKey: "fournisseur_id" });

UniteQte.hasMany(Product, { foreignKey: "id_unite" });
Product.belongsTo(UniteQte, { foreignKey: "id_unite" });

// Relations Approvisionnement
Product.hasMany(Approvisionnement, { foreignKey: "id_produit" });
Approvisionnement.belongsTo(Product, { foreignKey: "id_produit" });

User.hasMany(Approvisionnement, { foreignKey: "id_utilisateur" });
Approvisionnement.belongsTo(User, { foreignKey: "id_utilisateur" });

// Vente <-> DetailVente (Une vente a plusieurs détails)
Vente.hasMany(DetailVente, {
  foreignKey: "vente_id",
  as: "items",
  onDelete: "CASCADE",
});
DetailVente.belongsTo(Vente, { foreignKey: "vente_id", as: "vente" });

// DetailVente <-> Product
Product.hasMany(DetailVente, { foreignKey: "produit_id" });
DetailVente.belongsTo(Product, { foreignKey: "produit_id", as: "produit" });

// Vente <-> User
User.hasMany(Vente, { foreignKey: "user_id" });
Vente.belongsTo(User, { foreignKey: "user_id", as: "vendeur" });

// Relations Inventaire <-> DetailInventaire
Inventaire.hasMany(DetailInventaire, {
  foreignKey: "inventaire_id",
  as: "items",
  onDelete: "CASCADE",
});
DetailInventaire.belongsTo(Inventaire, { foreignKey: "inventaire_id" });

// Relations Produit <-> DetailInventaire
Product.hasMany(DetailInventaire, { foreignKey: "produit_id" });
DetailInventaire.belongsTo(Product, {
  foreignKey: "produit_id",
  as: "produit",
});

// Relations Utilisateur <-> Inventaire
User.hasMany(Inventaire, { foreignKey: "utilisateur_id" });
Inventaire.belongsTo(User, { foreignKey: "utilisateur_id", as: "utilisateur" });

// Relations Sortie <-> SortieItem
Sortie.hasMany(SortieItem, {
  foreignKey: "sortie_id",
  as: "items",
  onDelete: "CASCADE",
});
SortieItem.belongsTo(Sortie, { foreignKey: "sortie_id", as: "sortie" });

// Relations SortieItem <-> Product
Product.hasMany(SortieItem, { foreignKey: "produit_id" });
SortieItem.belongsTo(Product, { foreignKey: "produit_id", as: "produit" });

// Relations Sortie <-> User
User.hasMany(Sortie, { foreignKey: "user_id" });
Sortie.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ===================== AJOUT : Relations Entreprise / Abonne / Paiement =====================

// Entreprise <-> Abonne (une entreprise a plusieurs abonnés/employés)
Entreprise.hasMany(Abonne, { foreignKey: "entreprise_id", as: "abonnes" });
Abonne.belongsTo(Entreprise, { foreignKey: "entreprise_id", as: "entreprise" });

// Abonne <-> Vente (un abonné peut avoir plusieurs ventes/factures à crédit)
Abonne.hasMany(Vente, { foreignKey: "abonne_id", as: "ventes" });
Vente.belongsTo(Abonne, { foreignKey: "abonne_id", as: "abonne" });

// Abonne <-> Dependant (Un abonné a plusieurs dépendants) [AJOUT]
Abonne.hasMany(Dependant, {
  foreignKey: "abonne_id",
  as: "dependants",
  onDelete: "CASCADE",
});
Dependant.belongsTo(Abonne, { foreignKey: "abonne_id", as: "abonne" });

// Dependant <-> Vente (Un dépendant peut aussi avoir des ventes à crédit sous le compte de l'abonné) [AJOUT]
Dependant.hasMany(Vente, { foreignKey: "dependant_id", as: "ventes" });
Vente.belongsTo(Dependant, { foreignKey: "dependant_id", as: "dependant" });

// Vente <-> Paiement (une vente peut recevoir plusieurs paiements/remboursements)
Vente.hasMany(Paiement, {
  foreignKey: "vente_id",
  as: "paiements",
  onDelete: "CASCADE",
});
Paiement.belongsTo(Vente, { foreignKey: "vente_id", as: "vente" });

// ===============================================================================================

module.exports = {
  User,
  Category,
  Fournisseur,
  UniteQte,
  Product,
  Approvisionnement,
  Vente,
  Inventaire,
  DetailInventaire,
  DetailVente,
  Sortie,
  SortieItem,
  Entreprise, // AJOUT
  Abonne, // AJOUT
  Paiement, // AJOUT
  Dependant, // AJOUT
  sequelize,
};
