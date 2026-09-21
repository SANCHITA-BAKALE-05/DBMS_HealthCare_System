const express = require('express');
const router  = express.Router();
const { getMyMedicalRecords, getPatientMedicalRecords, createMedicalRecord } = require('../controllers/medicalRecordController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/',                    authenticate, authorize('PATIENT'), getMyMedicalRecords);
router.get('/patient/:patientId',  authenticate, authorize('DOCTOR', 'ADMIN'), getPatientMedicalRecords);
router.post('/',                   authenticate, authorize('DOCTOR'), createMedicalRecord);

module.exports = router;
