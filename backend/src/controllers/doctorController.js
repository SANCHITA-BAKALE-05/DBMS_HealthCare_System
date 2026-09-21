// ============================================================
// doctorController.js
// Doctor profile + availability management.
// Tables: Doctor, Doctor_Availability, Department
// ============================================================

const db = require('../config/db');

// GET /api/doctors
// List all doctors with their department name (public)
const getAllDoctors = async (req, res) => {
  try {
    const { department_id, specialization } = req.query;

    let query = `
      SELECT d.doctor_id, d.first_name, d.last_name, d.specialization,
             d.qualification, d.experience_years, d.phone, d.email,
             dep.department_id, dep.department_name
      FROM Doctor d
      JOIN Department dep ON d.department_id = dep.department_id
    `;
    const params = [];

    if (department_id) {
      query += ' WHERE d.department_id = ?';
      params.push(department_id);
    }
    if (specialization) {
      query += params.length ? ' AND' : ' WHERE';
      query += ' d.specialization LIKE ?';
      params.push(`%${specialization}%`);
    }

    query += ' ORDER BY d.first_name, d.last_name';

    const [rows] = await db.query(query, params);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAllDoctors error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctors.' });
  }
};

// GET /api/doctors/:id
// Get a single doctor's details
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT d.doctor_id, d.first_name, d.last_name, d.specialization,
              d.qualification, d.experience_years, d.phone, d.email,
              dep.department_id, dep.department_name
       FROM Doctor d
       JOIN Department dep ON d.department_id = dep.department_id
       WHERE d.doctor_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    }
    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getDoctorById error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctor.' });
  }
};

// GET /api/doctors/:id/availability
// Get available slots for a specific doctor
// Optional query: ?date=YYYY-MM-DD
const getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let query = `
      SELECT da.availability_id, da.available_date, da.start_time,
             da.end_time, da.status
      FROM Doctor_Availability da
      WHERE da.doctor_id = ?
        AND da.available_date >= CURDATE()
    `;
    const params = [id];

    if (date) {
      query += ' AND da.available_date = ?';
      params.push(date);
    }

    query += ' ORDER BY da.available_date, da.start_time';

    const [rows] = await db.query(query, params);
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDoctorAvailability error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch availability.' });
  }
};

// GET /api/doctors/profile  — for logged-in doctor
const getDoctorProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const [rows] = await db.query(
      `SELECT d.doctor_id, d.first_name, d.last_name, d.specialization,
              d.qualification, d.experience_years, d.phone, d.email,
              dep.department_id, dep.department_name
       FROM Doctor d
       JOIN Department dep ON d.department_id = dep.department_id
       WHERE d.user_id = ?`,
      [user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Doctor profile not found.' });
    }
    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getDoctorProfile error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch profile.' });
  }
};

// GET /api/doctors/my-availability — doctor sees own slots
const getMyAvailability = async (req, res) => {
  try {
    const { user_id } = req.user;

    const [doctor] = await db.query(
      'SELECT doctor_id FROM Doctor WHERE user_id = ?',
      [user_id]
    );
    if (doctor.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    }

    const [rows] = await db.query(
      `SELECT availability_id, available_date, start_time, end_time, status
       FROM Doctor_Availability
       WHERE doctor_id = ?
       ORDER BY available_date, start_time`,
      [doctor[0].doctor_id]
    );

    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyAvailability error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch availability.' });
  }
};

// POST /api/doctors/my-availability — doctor adds a slot
const addAvailabilitySlot = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { available_date, start_time, end_time } = req.body;

    if (!available_date || !start_time || !end_time) {
      return res.status(400).json({
        status: 'error',
        message: 'available_date, start_time, and end_time are required.'
      });
    }

    const [doctor] = await db.query(
      'SELECT doctor_id FROM Doctor WHERE user_id = ?',
      [user_id]
    );
    if (doctor.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    }

    const { generateNextId } = require('../utils/idGenerator');
    const availability_id = await generateNextId('Doctor_Availability', 'availability_id', 'A', 3);

    await db.query(
      `INSERT INTO Doctor_Availability
       (availability_id, doctor_id, available_date, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'AVAILABLE')`,
      [availability_id, doctor[0].doctor_id, available_date, start_time, end_time]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Availability slot added.',
      data: { availability_id }
    });
  } catch (error) {
    console.error('addAvailabilitySlot error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'This slot already exists.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to add slot.' });
  }
};

// DELETE /api/doctors/my-availability/:id — doctor removes an AVAILABLE slot
const removeAvailabilitySlot = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;

    const [doctor] = await db.query(
      'SELECT doctor_id FROM Doctor WHERE user_id = ?',
      [user_id]
    );
    if (doctor.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Doctor not found.' });
    }

    // Confirm the slot belongs to this doctor and is not yet booked
    const [slot] = await db.query(
      'SELECT status FROM Doctor_Availability WHERE availability_id = ? AND doctor_id = ?',
      [id, doctor[0].doctor_id]
    );
    if (slot.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Slot not found.' });
    }
    if (slot[0].status === 'BOOKED') {
      return res.status(400).json({ status: 'error', message: 'Cannot remove a booked slot.' });
    }

    await db.query('DELETE FROM Doctor_Availability WHERE availability_id = ?', [id]);
    return res.status(200).json({ status: 'success', message: 'Slot removed.' });
  } catch (error) {
    console.error('removeAvailabilitySlot error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to remove slot.' });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailability,
  getDoctorProfile,
  getMyAvailability,
  addAvailabilitySlot,
  removeAvailabilitySlot
};
