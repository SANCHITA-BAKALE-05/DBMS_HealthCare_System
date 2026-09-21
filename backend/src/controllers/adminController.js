// ============================================================
// adminController.js
// Admin management endpoints.
// All routes require role: ADMIN
// ============================================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateNextId } = require('../utils/idGenerator');

// --- PATIENTS ---

// GET /api/admin/patients
const getAllPatients = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth,
              p.gender, p.phone, p.email, p.address, p.blood_group,
              p.created_at,
              u.username, u.account_status,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age
       FROM Patient p
       JOIN User_Account u ON p.user_id = u.user_id
       ORDER BY p.created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllPatients error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch patients.' });
  }
};

// PUT /api/admin/patients/:id/status  — activate/block/deactivate account
const updatePatientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { account_status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];
    if (!validStatuses.includes(account_status)) {
      return res.status(400).json({ status: 'error', message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const [patient] = await db.query('SELECT user_id FROM Patient WHERE patient_id = ?', [id]);
    if (patient.length === 0) return res.status(404).json({ status: 'error', message: 'Patient not found.' });

    await db.query('UPDATE User_Account SET account_status = ? WHERE user_id = ?', [account_status, patient[0].user_id]);
    return res.status(200).json({ status: 'success', message: `Patient account status updated to ${account_status}.` });
  } catch (error) {
    console.error('updatePatientStatus error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update patient status.' });
  }
};

// --- DOCTORS ---

// GET /api/admin/doctors
const getAllDoctors = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.doctor_id, d.first_name, d.last_name, d.specialization,
              d.qualification, d.experience_years, d.phone, d.email,
              dep.department_name, u.username, u.account_status, d.created_at
       FROM Doctor d
       JOIN Department dep ON d.department_id = dep.department_id
       JOIN User_Account u ON d.user_id = u.user_id
       ORDER BY d.created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllDoctors error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctors.' });
  }
};

// POST /api/admin/doctors — admin creates a new doctor account
const createDoctor = async (req, res) => {
  const {
    username, password,
    first_name, last_name, specialization, department_id,
    qualification, experience_years, phone, email
  } = req.body;

  if (!username || !password || !first_name || !last_name ||
      !specialization || !department_id || !phone || !email) {
    return res.status(400).json({ status: 'error', message: 'All required fields must be provided.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT user_id FROM User_Account WHERE username = ?', [username]);
    if (existing.length > 0) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ status: 'error', message: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user_id   = await generateNextId('User_Account', 'user_id', 'U', 3);
    const doctor_id = await generateNextId('Doctor', 'doctor_id', 'D', 3);

    await conn.query(
      `INSERT INTO User_Account (user_id, username, password_hash, role, account_status)
       VALUES (?, ?, ?, 'DOCTOR', 'ACTIVE')`,
      [user_id, username, password_hash]
    );
    await conn.query(
      `INSERT INTO Doctor (doctor_id, user_id, first_name, last_name, specialization,
        department_id, qualification, experience_years, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doctor_id, user_id, first_name, last_name, specialization,
       department_id, qualification || null, experience_years || 0, phone, email]
    );

    await conn.commit();
    conn.release();
    return res.status(201).json({ status: 'success', message: 'Doctor account created.', data: { doctor_id } });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('createDoctor error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Phone or email already registered.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create doctor.' });
  }
};

// --- ALL APPOINTMENTS (admin view) ---

// GET /api/admin/appointments
const getAllAppointments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.reason, a.status, a.created_at,
              da.available_date, da.start_time, da.end_time,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name, p.patient_id,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.doctor_id,
              dep.department_name
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       JOIN Department dep ON d.department_id = dep.department_id
       ORDER BY da.available_date DESC, da.start_time DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllAppointments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointments.' });
  }
};

// --- PAYMENTS (admin view) ---

// GET /api/admin/payments
const getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pay.payment_id, pay.amount, pay.payment_method,
              pay.payment_status, pay.transaction_reference, pay.payment_date,
              a.appointment_id,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
       FROM Payment pay
       JOIN Appointment a ON pay.appointment_id = a.appointment_id
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       ORDER BY pay.payment_date DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllPayments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch payments.' });
  }
};

// --- FEEDBACK (admin view) ---

// GET /api/admin/feedback
const getAllFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.feedback_id, f.rating, f.comments, f.created_at,
              a.appointment_id,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization
       FROM Feedback f
       JOIN Appointment a ON f.appointment_id = a.appointment_id
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       ORDER BY f.created_at DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllFeedback error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch feedback.' });
  }
};

// --- AUDIT LOG ---

// GET /api/admin/audit
const getAuditLog = async (req, res) => {
  try {
    const { appointment_id } = req.query;

    let query = `
      SELECT aa.audit_id, aa.appointment_id, aa.old_status, aa.new_status,
             aa.changed_at, aa.changed_by, aa.remarks,
             CONCAT(p.first_name, ' ', p.last_name) AS patient_name
      FROM Appointment_Audit aa
      JOIN Appointment a ON aa.appointment_id = a.appointment_id
      JOIN Patient p ON a.patient_id = p.patient_id
    `;
    const params = [];

    if (appointment_id) {
      query += ' WHERE aa.appointment_id = ?';
      params.push(appointment_id);
    }

    query += ' ORDER BY aa.changed_at DESC';

    const [rows] = await db.query(query, params);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAuditLog error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch audit log.' });
  }
};

// GET /api/admin/availability  — admin manages all availability
const getAllAvailability = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT da.availability_id, da.available_date, da.start_time, da.end_time, da.status,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.doctor_id, dep.department_name
       FROM Doctor_Availability da
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       JOIN Department dep ON d.department_id = dep.department_id
       ORDER BY da.available_date DESC, da.start_time`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllAvailability error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch availability.' });
  }
};

module.exports = {
  getAllPatients, updatePatientStatus,
  getAllDoctors, createDoctor,
  getAllAppointments,
  getAllPayments,
  getAllFeedback,
  getAuditLog,
  getAllAvailability
};
