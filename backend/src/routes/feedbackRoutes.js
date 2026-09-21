const express = require('express');
const router  = express.Router();
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/',   authenticate, authorize('PATIENT'), submitFeedback);
router.get('/my',  authenticate, authorize('PATIENT'), getMyFeedback);

module.exports = router;
