// controllers/dependant.controller.js
const { Dependant, Abonne } = require("../models");

// Récupérer tous les dépendants d'un abonné
exports.getDependantsByAbonne = async (req, res) => {
  try {
    const { abonne_id } = req.params;
    const dependants = await Dependant.findAll({
      where: { abonne_id, actif: true },
      order: [["nom", "ASC"]],
    });
    res.status(200).json(dependants);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des dépendants",
      error: error.message,
    });
  }
};

// Créer un dépendant pour un abonné
exports.createDependant = async (req, res) => {
  try {
    const { abonne_id, nom, lien, telephone } = req.body;

    if (!abonne_id || !nom || nom.trim() === "") {
      return res
        .status(400)
        .json({
          message:
            "L'abonné principal et le nom du dépendant sont obligatoires.",
        });
    }

    const abonne = await Abonne.findByPk(abonne_id);
    if (!abonne) {
      return res.status(404).json({ message: "Abonné principal introuvable." });
    }

    const dependant = await Dependant.create({
      abonne_id,
      nom: nom.trim(),
      lien: lien ? lien.trim() : null,
      telephone: telephone || null,
    });

    res
      .status(201)
      .json({ message: "Dépendant ajouté avec succès", dependant });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création du dépendant",
      error: error.message,
    });
  }
};

// Mettre à jour un dépendant
exports.updateDependant = async (req, res) => {
  try {
    const dependant = await Dependant.findByPk(req.params.id);
    if (!dependant) {
      return res.status(404).json({ message: "Dépendant non trouvé" });
    }

    const { nom, lien, telephone, actif } = req.body;

    await dependant.update({
      nom: nom !== undefined ? nom.trim() : dependant.nom,
      lien: lien !== undefined ? lien.trim() : dependant.lien,
      telephone: telephone !== undefined ? telephone : dependant.telephone,
      actif: actif !== undefined ? actif : dependant.actif,
    });

    res.status(200).json({ message: "Dépendant mis à jour", dependant });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// Désactiver un dépendant
exports.deleteDependant = async (req, res) => {
  try {
    const dependant = await Dependant.findByPk(req.params.id);
    if (!dependant) {
      return res.status(404).json({ message: "Dépendant non trouvé" });
    }

    await dependant.update({ actif: false });
    res.status(200).json({ message: "Dépendant désactivé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de la désactivation",
        error: error.message,
      });
  }
};
