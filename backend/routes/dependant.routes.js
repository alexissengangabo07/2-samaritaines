// routes/dependant.routes.js
const express = require("express");
const router = express.Router();
const dependantController = require("../controllers/dependant.controller");

router.get("/abonne/:abonne_id", dependantController.getDependantsByAbonne);
router.post("/", dependantController.createDependant);
router.put("/:id", dependantController.updateDependant);
router.delete("/:id", dependantController.deleteDependant);

module.exports = router;
