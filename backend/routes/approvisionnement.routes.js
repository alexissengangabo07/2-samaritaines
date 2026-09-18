const express = require('express');
const router = express.Router();
const approController = require('../controllers/approvisionnement.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', approController.getAllApprovisionnements);
router.post('/', authorizeRoles('admin', 'pharmacien'), approController.createApprovisionnement);
router.delete('/:id', authorizeRoles('admin'), approController.deleteApprovisionnement);

module.exports = router;