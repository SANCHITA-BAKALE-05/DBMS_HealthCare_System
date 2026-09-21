// ============================================================
// authRoutes.js
// ============================================================

const express    = require('express');
const router     = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/auth/register  — public
router.post('/register', register);

// POST /api/auth/login     — public
router.post('/login', login);

// GET  /api/auth/me        — requires valid JWT
router.get('/me', authenticate, getMe);

module.exports = router;
