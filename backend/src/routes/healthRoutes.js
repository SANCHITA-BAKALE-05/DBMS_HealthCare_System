// ============================================================
// healthRoutes.js
// Registers the health/status endpoint.
// ============================================================

const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');

// GET /api/health
// No authentication required — this is a public status check
router.get('/', getHealth);

module.exports = router;
