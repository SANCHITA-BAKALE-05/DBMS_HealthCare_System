// ============================================================
// departmentController.js
// Table: Department (department_id, department_name, description, created_at)
// ============================================================

const db = require('../config/db');

// GET /api/departments  — public, list all departments
const getAllDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dep.department_id, dep.department_name, dep.description,
              COUNT(DISTINCT d.doctor_id) AS total_doctors
       FROM Department dep
       LEFT JOIN Doctor d ON dep.department_id = d.department_id
       GROUP BY dep.department_id, dep.department_name, dep.description
       ORDER BY dep.department_name`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllDepartments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch departments.' });
  }
};

// POST /api/departments  — admin adds a department
const createDepartment = async (req, res) => {
  try {
    const { department_name, description } = req.body;
    if (!department_name) {
      return res.status(400).json({ status: 'error', message: 'department_name is required.' });
    }
    const [result] = await db.query(
      'INSERT INTO Department (department_name, description) VALUES (?, ?)',
      [department_name, description || null]
    );
    return res.status(201).json({
      status: 'success',
      message: 'Department created.',
      data: { department_id: result.insertId }
    });
  } catch (error) {
    console.error('createDepartment error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Department name already exists.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create department.' });
  }
};

module.exports = { getAllDepartments, createDepartment };
