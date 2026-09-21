const express = require('express');
const router  = express.Router();
const {
  getAllDoctors, getDoctorById, getDoctorAvailability,
  getDoctorProfile, getMyAvailability, addAvailabilitySlot, removeAvailabilitySlot
} = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes (patients need to browse doctors without logging in is fine,
// but we also allow authenticated access)
router.get('/',                       getAllDoctors);
router.get('/profile',                authenticate, authorize('DOCTOR'), getDoctorProfile);
router.get('/my-availability',        authenticate, authorize('DOCTOR'), getMyAvailability);
router.post('/my-availability',       authenticate, authorize('DOCTOR'), addAvailabilitySlot);
router.delete('/my-availability/:id', authenticate, authorize('DOCTOR'), removeAvailabilitySlot);
router.get('/:id',                    getDoctorById);
router.get('/:id/availability',       getDoctorAvailability);

module.exports = router;
