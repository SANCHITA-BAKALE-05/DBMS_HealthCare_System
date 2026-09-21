const express = require('express');
const router  = express.Router();
const {
  bookAppointment, getMyAppointments, getAppointmentById,
  cancelAppointment, updateAppointmentStatus, getDoctorAppointments
} = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Patient routes
router.post('/',                  authenticate, authorize('PATIENT'), bookAppointment);
router.get('/',                   authenticate, authorize('PATIENT'), getMyAppointments);
router.get('/doctor',             authenticate, authorize('DOCTOR'),  getDoctorAppointments);
router.get('/:id',                authenticate, getAppointmentById);
router.put('/:id/cancel',         authenticate, authorize('PATIENT'), cancelAppointment);
router.put('/:id/status',         authenticate, authorize('DOCTOR', 'ADMIN'), updateAppointmentStatus);

module.exports = router;
