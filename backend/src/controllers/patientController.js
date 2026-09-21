// ============================================================
// patientController.js
// Patient profile management.
// Table: Patient (patient_id, user_id, first_name, last_name,
//         date_of_birth, gender, phone, email, address, blood_group)
// ============================================================

const db = require('../config/db');

// GET /api/patients/profile
// Returns the logged-in patient's full profile.
const getProfile = async (req, res) => {
  try {
    const { user_id } = req.user;

    const [rows] = await db.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth,
              p.gender, p.phone, p.email, p.address, p.blood_group,
              p.created_at,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age
       FROM Patient p
       WHERE p.user_id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found.' });
    }

    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getProfile error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile.' });
  }
};

// PUT /api/patients/profile
// Update allowed fields: phone, address, blood_group
const updateProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { phone, address, blood_group } = req.body;

    // Get the patient record to confirm it exists
    const [rows] = await db.query(
      'SELECT patient_id FROM Patient WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found.' });
    }

    await db.query(
      `UPDATE Patient
       SET phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           blood_group = COALESCE(?, blood_group)
       WHERE user_id = ?`,
      [phone || null, address || null, blood_group || null, user_id]
    );

    return res.status(200).json({ status: 'success', message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Phone number already in use.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
};

// GET /api/patients/:id  (admin use — get any patient)
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth,
              p.gender, p.phone, p.email, p.address, p.blood_group, p.created_at,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age
       FROM Patient p WHERE p.patient_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Patient not found.' });
    }
    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getPatientById error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch patient.' });
  }
};

module.exports = { getProfile, updateProfile, getPatientById };
