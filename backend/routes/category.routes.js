const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', categoryController.getAll);
router.post('/', authorizeRoles('admin', 'pharmacien'), categoryController.create);
router.put('/:id', authorizeRoles('admin', 'pharmacien'), categoryController.update);
router.delete('/:id', authorizeRoles('admin'), categoryController.delete);

module.exports = router;