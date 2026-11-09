const express = require("express");
const router = express.Router();
const stockSecController = require("../controllers/stockSecondaire.controller");

router.get("/", stockSecController.getAllStockSecondaire);
router.get("/internes", stockSecController.getFacturesInternes);
router.post("/facturer", stockSecController.facturerInterne);
router.post("/facturer-plus/:id", stockSecController.ajouterArticlesInterne);

module.exports = router;
