const express = require('express');
const router = express.Router();
const fournisseurController = require('../controllers/fournisseur.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', fournisseurController.getAllFournisseurs);
router.get('/:id', fournisseurController.getFournisseurById);
router.post('/', authorizeRoles('admin', 'pharmacien'), fournisseurController.createFournisseur);
router.put('/:id', authorizeRoles('admin', 'pharmacien'), fournisseurController.updateFournisseur);
router.delete('/:id', authorizeRoles('admin'), fournisseurController.deleteFournisseur);

module.exports = router;