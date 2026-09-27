const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const venteRoutes = require('./vente.routes');
const approRoutes = require('./approvisionnement.routes');
const categoryRoutes = require('./category.routes');
const fournisseurRoutes = require('./fournisseur.routes');
const uniteRoutes = require('./uniteQte.routes');
const inventaireRoutes = require('./inventaire.routes');
const sortieRoutes = require('./sortie.routes');
const abonneRoutes = require('./abonne.routes');
const entrepriseRoutes = require('./entreprise.routes');

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/ventes', venteRoutes);
router.use('/approvisionnements', approRoutes);
router.use('/categories', categoryRoutes);
router.use('/fournisseurs', fournisseurRoutes);
router.use('/unites', uniteRoutes);
router.use('/inventaires', inventaireRoutes);
router.use('/sorties', sortieRoutes);
router.use('/abonnes', abonneRoutes); // AJOUT
router.use('/entreprises', entrepriseRoutes); // AJOUT

module.exports = router;