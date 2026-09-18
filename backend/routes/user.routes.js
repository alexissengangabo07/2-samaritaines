const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// Auth
router.post('/login', userController.login);

// CRUD Utilisateurs
router.get('/', verifyToken, userController.getAllUsers);
router.get('/me', verifyToken, userController.getMe);
router.get('/:id', verifyToken, userController.getUserById);
router.post('/', userController.createUser);
// router.post('/', verifyToken, authorizeRoles('admin'), userController.createUser);
router.put('/:id', verifyToken, userController.updateUser);
router.delete('/:id', verifyToken, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;