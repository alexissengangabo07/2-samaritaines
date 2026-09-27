const express = require('express');
const router = express.Router();
const venteController = require('../controllers/vente.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', venteController.getAllVentes);
router.get('/credit', venteController.getVentesCredit);
router.get('/:id', venteController.getVenteById);
router.post('/', venteController.createVente); // Accessible à tous les rôles authentifiés (assistant, etc.)
router.delete('/:id', authorizeRoles('admin', 'pharmacien'), venteController.deleteVente);
router.post('/:id/items', venteController.addItemsToVente);
router.post('/:id/items', venteController.addItemsToVente);
router.post('/paiements', venteController.addPaiement);

module.exports = router;