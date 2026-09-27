const { Entreprise, Abonne } = require('../models');

// READ : liste des entreprises (actives par défaut, toutes si ?all=true)
exports.getAllEntreprises = async (req, res) => {
  try {
    const where = req.query.all === 'true' ? {} : { actif: true };
    const entreprises = await Entreprise.findAll({
      where,
      order: [['nom', 'ASC']]
    });
    res.status(200).json(entreprises);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des entreprises",
      error: error.message
    });
  }
};

// READ : une entreprise + la liste de ses abonnés (employés)
exports.getEntrepriseById = async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id, {
      include: [{ model: Abonne, as: 'abonnes' }]
    });

    if (!entreprise) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    res.status(200).json(entreprise);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE
exports.createEntreprise = async (req, res) => {
  try {
    const { nom, adresse, telephone, email, contact_principal, pourcentage_reduction } = req.body;

    if (!nom || nom.trim() === '') {
      return res.status(400).json({ message: "Le nom de l'entreprise est obligatoire." });
    }

    const pct = parseFloat(pourcentage_reduction ?? 0);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ message: "Le pourcentage de réduction doit être compris entre 0 et 100." });
    }

    const existante = await Entreprise.findOne({ where: { nom: nom.trim() } });
    if (existante) {
      return res.status(409).json({ message: "Une entreprise avec ce nom existe déjà." });
    }

    const entreprise = await Entreprise.create({
      nom: nom.trim(),
      adresse: adresse || null,
      telephone: telephone || null,
      email: email || null,
      contact_principal: contact_principal || null,
      pourcentage_reduction: pct
    });

    res.status(201).json({ message: "Entreprise créée avec succès", entreprise });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la création de l'entreprise",
      error: error.message
    });
  }
};

// UPDATE
exports.updateEntreprise = async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id);
    if (!entreprise) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    const { nom, adresse, telephone, email, contact_principal, pourcentage_reduction, actif } = req.body;

    if (pourcentage_reduction !== undefined) {
      const pct = parseFloat(pourcentage_reduction);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ message: "Le pourcentage de réduction doit être compris entre 0 et 100." });
      }
    }

    // Si le nom change, vérifier qu'il n'entre pas en conflit avec une autre entreprise
    if (nom !== undefined && nom.trim() !== entreprise.nom) {
      const conflit = await Entreprise.findOne({ where: { nom: nom.trim() } });
      if (conflit) {
        return res.status(409).json({ message: "Une entreprise avec ce nom existe déjà." });
      }
    }

    await entreprise.update({
      nom: nom !== undefined ? nom.trim() : entreprise.nom,
      adresse: adresse !== undefined ? adresse : entreprise.adresse,
      telephone: telephone !== undefined ? telephone : entreprise.telephone,
      email: email !== undefined ? email : entreprise.email,
      contact_principal: contact_principal !== undefined ? contact_principal : entreprise.contact_principal,
      pourcentage_reduction: pourcentage_reduction !== undefined ? parseFloat(pourcentage_reduction) : entreprise.pourcentage_reduction,
      actif: actif !== undefined ? actif : entreprise.actif
    });

    res.status(200).json({ message: "Entreprise mise à jour", entreprise });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE (désactivation logique, pas de suppression physique)
exports.deleteEntreprise = async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id);
    if (!entreprise) {
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    await entreprise.update({ actif: false });
    res.status(200).json({ message: "Entreprise désactivée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la désactivation", error: error.message });
  }
};