// ============================================================
// patientController.js
//
// PURPOSE:
//   Handles everything related to a patient's own profile.
//   A patient can view their profile and update limited fields.
//   Admins can also look up any patient by ID.
//
// DATABASE TABLE USED:
//   Patient
//     patient_id   — unique ID like 'P001'
//     user_id      — links to User_Account (for login)
//     first_name, last_name
//     date_of_birth — used to calculate age with TIMESTAMPDIFF
//     gender, phone, email, address, blood_group
//     created_at   — when the patient registered
//
// SECURITY NOTE:
//   A patient can only read/edit their OWN profile.
//   The user_id comes from the verified JWT token (req.user),
//   not from the URL — so a patient cannot spoof another user's ID.
// ============================================================

const db = require('../config/db');

// ============================================================
// GET /api/patients/profile
//
// Returns the complete profile of the currently logged-in patient.
//
// TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) calculates
// the patient's current age in years automatically —
// no need to store age separately.
//
// The user_id is taken from req.user which was set by the
// authenticate middleware after verifying the JWT token.
// ============================================================
const getProfile = async (req, res) => {
  try {
    // req.user is populated by authMiddleware after JWT is verified
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

// ============================================================
// PUT /api/patients/profile
//
// Lets a patient update only certain safe fields:
//   phone, address, blood_group
//
// Fields like first_name, email, date_of_birth are NOT
// editable here because they affect identity verification.
//
// COALESCE(?, column) means:
//   "use the new value if provided, otherwise keep the old one"
//   This allows partial updates — the patient doesn't need
//   to send all fields, just the ones they want to change.
// ============================================================
const updateProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { phone, address, blood_group } = req.body;

    // First confirm this patient exists in the database
    const [rows] = await db.query(
      'SELECT patient_id FROM Patient WHERE user_id = ?',
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Patient profile not found.' });
    }

    // COALESCE: if the new value is null/undefined, keep the existing DB value
    await db.query(
      `UPDATE Patient
       SET phone       = COALESCE(?, phone),
           address     = COALESCE(?, address),
           blood_group = COALESCE(?, blood_group)
       WHERE user_id = ?`,
      [phone || null, address || null, blood_group || null, user_id]
    );

    return res.status(200).json({ status: 'success', message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    // ER_DUP_ENTRY means the phone number already belongs to another patient
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Phone number already in use.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
};

// ============================================================
// GET /api/patients/:id
//
// Admin-only route to look up any patient by their patient_id.
// Used in the admin "Manage Patients" page.
//
// This route is protected by authorize('ADMIN') in the routes
// file, so regular patients cannot access other patients' data.
// ============================================================
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params; // patient_id from the URL e.g. /api/patients/P001
    const [rows] = await db.query(
      `SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth,
              p.gender, p.phone, p.email, p.address, p.blood_group, p.created_at,
              TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age
       FROM Patient p
       WHERE p.patient_id = ?`,
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
