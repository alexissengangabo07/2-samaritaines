const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/license.controller');

// GET /api/license/status -> { expire: boolean, dateExpiration: string }
router.get('/status', licenseController.getStatus);

module.exports = router;