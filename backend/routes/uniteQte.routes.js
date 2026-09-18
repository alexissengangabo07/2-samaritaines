const express = require('express');
const router = express.Router();
const uniteController = require('../controllers/uniteQte.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', uniteController.getAllUnites);
router.get('/:id', uniteController.getUniteById);
router.post('/', authorizeRoles('admin', 'pharmacien'), uniteController.createUnite);
router.put('/:id', authorizeRoles('admin', 'pharmacien'), uniteController.updateUnite);
router.delete('/:id', authorizeRoles('admin'), uniteController.deleteUnite);

module.exports = router;