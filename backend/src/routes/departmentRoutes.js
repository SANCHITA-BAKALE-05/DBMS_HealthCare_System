const express = require('express');
const router  = express.Router();
const { getAllDepartments, createDepartment } = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/',  getAllDepartments);  // public
router.post('/', authenticate, authorize('ADMIN'), createDepartment);

module.exports = router;
