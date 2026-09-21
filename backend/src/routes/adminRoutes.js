const express = require('express');
const router  = express.Router();
const {
  getAllPatients, updatePatientStatus,
  getAllDoctors, createDoctor,
  getAllAppointments,
  getAllPayments,
  getAllFeedback,
  getAuditLog,
  getAllAvailability
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const isAdmin = [authenticate, authorize('ADMIN')];

router.get('/patients',              ...isAdmin, getAllPatients);
router.put('/patients/:id/status',   ...isAdmin, updatePatientStatus);
router.get('/doctors',               ...isAdmin, getAllDoctors);
router.post('/doctors',              ...isAdmin, createDoctor);
router.get('/appointments',          ...isAdmin, getAllAppointments);
router.get('/payments',              ...isAdmin, getAllPayments);
router.get('/feedback',              ...isAdmin, getAllFeedback);
router.get('/audit',                 ...isAdmin, getAuditLog);
router.get('/availability',          ...isAdmin, getAllAvailability);

module.exports = router;
