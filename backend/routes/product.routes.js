const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken); // Protège toutes les routes ci-dessous

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', authorizeRoles('admin', 'pharmacien'), productController.createProduct);
router.put('/:id', authorizeRoles('admin', 'pharmacien'), productController.updateProduct);
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;