const express = require('express');
const router  = express.Router();
const { getProfile, updateProfile, getPatientById } = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Patient's own profile
router.get('/profile',    authenticate, authorize('PATIENT'), getProfile);
router.put('/profile',    authenticate, authorize('PATIENT'), updateProfile);

// Admin: get specific patient by ID
router.get('/:id',        authenticate, authorize('ADMIN'), getPatientById);

module.exports = router;
