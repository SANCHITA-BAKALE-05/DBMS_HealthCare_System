const express = require('express');
const router  = express.Router();
const { getMyPrescriptions, getPatientPrescriptions, createPrescription } = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/',                    authenticate, authorize('PATIENT'), getMyPrescriptions);
router.get('/patient/:patientId',  authenticate, authorize('DOCTOR', 'ADMIN'), getPatientPrescriptions);
router.post('/',                   authenticate, authorize('DOCTOR'), createPrescription);

module.exports = router;
