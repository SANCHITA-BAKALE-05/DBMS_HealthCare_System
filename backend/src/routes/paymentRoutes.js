const express = require('express');
const router  = express.Router();
const { getMyPayments } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorize('PATIENT'), getMyPayments);

module.exports = router;
