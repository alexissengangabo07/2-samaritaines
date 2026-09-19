const express = require('express');
const router = express.Router();
const sortieController = require('../controllers/sortie.controller');
// const { verifyToken } = require('../middlewares/auth'); // Décommentez si vous utilisez un middleware JWT

router.post('/', sortieController.createSortie);
router.get('/', sortieController.getAllSorties);
router.get('/stats/summary', sortieController.getSortieStats);
router.get('/:id', sortieController.getSortieById);

module.exports = router;