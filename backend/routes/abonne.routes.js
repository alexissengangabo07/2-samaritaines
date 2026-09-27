const express = require('express');
const router = express.Router();
const abonneController = require('../controllers/abonne.controller');

// GET /api/abonnes           -> liste des abonnés actifs (ou tous si ?all=true)
router.get('/', abonneController.getAllAbonnes);

// GET /api/abonnes/:id       -> un abonné + son entreprise + son historique de ventes
router.get('/:id', abonneController.getAbonneById);

// POST /api/abonnes          -> créer un nouvel abonné
router.post('/', abonneController.createAbonne);

// PUT /api/abonnes/:id       -> modifier un abonné existant
router.put('/:id', abonneController.updateAbonne);

// DELETE /api/abonnes/:id    -> désactiver un abonné (pas de suppression physique)
router.delete('/:id', abonneController.deleteAbonne);

module.exports = router;