const express = require('express');
const router = express.Router();
const entrepriseController = require('../controllers/entreprise.controller');

// GET /api/entreprises           -> liste des entreprises actives (ou toutes si ?all=true)
router.get('/', entrepriseController.getAllEntreprises);

// GET /api/entreprises/:id       -> une entreprise + la liste de ses abonnés
router.get('/:id', entrepriseController.getEntrepriseById);

// POST /api/entreprises          -> créer une nouvelle entreprise
router.post('/', entrepriseController.createEntreprise);

// PUT /api/entreprises/:id       -> modifier une entreprise existante
router.put('/:id', entrepriseController.updateEntreprise);

// DELETE /api/entreprises/:id    -> désactiver une entreprise (pas de suppression physique)
router.delete('/:id', entrepriseController.deleteEntreprise);

module.exports = router;