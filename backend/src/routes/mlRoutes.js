const express = require('express');
const router  = express.Router();
const { predictDiabetes, predictHypertension, predictCardiovascular, predictObesity } = require('../controllers/mlController');
const { authenticate } = require('../middleware/authMiddleware');

// All ML endpoints require a valid login (any role)
router.post('/diabetes',       authenticate, predictDiabetes);
router.post('/hypertension',   authenticate, predictHypertension);
router.post('/cardiovascular', authenticate, predictCardiovascular);
router.post('/obesity',        authenticate, predictObesity);

module.exports = router;
