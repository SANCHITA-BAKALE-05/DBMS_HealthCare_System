const express = require('express');
const router  = express.Router();
const {
  getSummary, getAppointmentStats, getDepartmentStats,
  getDoctorStats, getRevenueStats, getPatientStats, getHealthMetrics,
  getAppointmentTrend, getGenderDistribution, getPaymentStatus
} = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const isAdmin = [authenticate, authorize('ADMIN')];

router.get('/summary',              ...isAdmin, getSummary);
router.get('/appointments',         ...isAdmin, getAppointmentStats);
router.get('/departments',          ...isAdmin, getDepartmentStats);
router.get('/doctors',              ...isAdmin, getDoctorStats);
router.get('/revenue',              ...isAdmin, getRevenueStats);
router.get('/patients',             ...isAdmin, getPatientStats);
router.get('/health-metrics',       ...isAdmin, getHealthMetrics);
router.get('/appointment-trend',    ...isAdmin, getAppointmentTrend);
router.get('/gender-distribution',  ...isAdmin, getGenderDistribution);
router.get('/payment-status',       ...isAdmin, getPaymentStatus);

module.exports = router;
