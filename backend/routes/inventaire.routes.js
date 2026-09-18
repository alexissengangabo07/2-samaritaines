const express = require('express');
const router = express.Router();
const inventaireController = require('../controllers/inventaire.controller');

router.get('/', inventaireController.getAllInventaires);
router.get('/:id', inventaireController.getInventaireById);
router.post('/', inventaireController.createInventaire);

module.exports = router;