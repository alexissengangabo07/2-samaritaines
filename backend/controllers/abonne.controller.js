const { Abonne, Vente, Entreprise, Dependant } = require("../models");

// READ : liste des abonnés (actifs par défaut), avec leur entreprise
exports.getAllAbonnes = async (req, res) => {
  try {
    const where = req.query.all === "true" ? {} : { actif: true };
    const abonnes = await Abonne.findAll({
      where,
      include: [
        {
          model: Entreprise,
          as: "entreprise",
          attributes: ["id", "nom", "pourcentage_reduction"],
        },
        {
          model: Dependant,
          as: "dependants",
          where: { actif: true },
          required: false,
        }, // Charge les dépendants
      ],
      order: [["nom", "ASC"]],
    });
    res.status(200).json(abonnes);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des abonnés",
      error: error.message,
    });
  }
};

// READ : un abonné + son entreprise + son historique de ventes
exports.getAbonneById = async (req, res) => {
  try {
    const abonne = await Abonne.findByPk(req.params.id, {
      include: [
        { model: Entreprise, as: "entreprise" },
        { model: Vente, as: "ventes" },
      ],
    });

    if (!abonne) {
      return res.status(404).json({ message: "Abonné non trouvé" });
    }

    res.status(200).json(abonne);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE
exports.createAbonne = async (req, res) => {
  try {
    const { nom, telephone, adresse, entreprise_id } = req.body;

    if (!nom || nom.trim() === "") {
      return res
        .status(400)
        .json({ message: "Le nom de l'abonné est obligatoire." });
    }

    // Si une entreprise est fournie, vérifier qu'elle existe réellement
    if (entreprise_id) {
      const entreprise = await Entreprise.findByPk(entreprise_id);
      if (!entreprise) {
        return res
          .status(404)
          .json({ message: "Entreprise sélectionnée introuvable." });
      }
    }

    const abonne = await Abonne.create({
      nom: nom.trim(),
      telephone: telephone || null,
      adresse: adresse || null,
      entreprise_id: entreprise_id || null,
    });

    // On renvoie l'abonné avec son entreprise chargée, pour que le frontend
    // affiche directement le taux de réduction sans requête supplémentaire
    const abonneComplet = await Abonne.findByPk(abonne.id, {
      include: [{ model: Entreprise, as: "entreprise" }],
    });

    res
      .status(201)
      .json({ message: "Abonné créé avec succès", abonne: abonneComplet });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création de l'abonné",
      error: error.message,
    });
  }
};

// UPDATE
exports.updateAbonne = async (req, res) => {
  try {
    const abonne = await Abonne.findByPk(req.params.id);
    if (!abonne) {
      return res.status(404).json({ message: "Abonné non trouvé" });
    }

    const { nom, telephone, adresse, entreprise_id, actif } = req.body;

    if (entreprise_id) {
      const entreprise = await Entreprise.findByPk(entreprise_id);
      if (!entreprise) {
        return res
          .status(404)
          .json({ message: "Entreprise sélectionnée introuvable." });
      }
    }

    await abonne.update({
      nom: nom !== undefined ? nom.trim() : abonne.nom,
      telephone: telephone !== undefined ? telephone : abonne.telephone,
      adresse: adresse !== undefined ? adresse : abonne.adresse,
      // entreprise_id peut être explicitement remis à null (abonné qui redevient individuel)
      entreprise_id:
        entreprise_id !== undefined
          ? entreprise_id || null
          : abonne.entreprise_id,
      actif: actif !== undefined ? actif : abonne.actif,
    });

    const abonneComplet = await Abonne.findByPk(abonne.id, {
      include: [{ model: Entreprise, as: "entreprise" }],
    });

    res
      .status(200)
      .json({ message: "Abonné mis à jour", abonne: abonneComplet });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE (désactivation logique)
exports.deleteAbonne = async (req, res) => {
  try {
    const abonne = await Abonne.findByPk(req.params.id);
    if (!abonne) {
      return res.status(404).json({ message: "Abonné non trouvé" });
    }

    await abonne.update({ actif: false });
    res.status(200).json({ message: "Abonné désactivé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de la désactivation",
        error: error.message,
      });
  }
};
