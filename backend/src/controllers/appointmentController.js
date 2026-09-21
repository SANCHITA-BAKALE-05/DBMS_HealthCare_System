// ============================================================
// appointmentController.js
// Complete appointment booking workflow.
//
// Tables used:
//   Appointment         (appointment_id, patient_id, availability_id, reason, status)
//   Doctor_Availability (availability_id, doctor_id, available_date, start_time, end_time, status)
//   Appointment_Audit   — handled automatically by DB trigger (do NOT insert manually)
//
// Key rules from existing schema:
//   - availability_id is UNIQUE in Appointment (one booking per slot)
//   - Booking must update Doctor_Availability.status to 'BOOKED'
//   - Both operations run inside a transaction
//   - DB trigger handles Appointment_Audit automatically on UPDATE
// ============================================================

const db = require('../config/db');
const { generateNextId } = require('../utils/idGenerator');

// POST /api/appointments
// Book an appointment (PATIENT only)
const bookAppointment = async (req, res) => {
  const { availability_id, reason } = req.body;
  const { patient_id } = req.user;

  if (!availability_id) {
    return res.status(400).json({ status: 'error', message: 'availability_id is required.' });
  }
  if (!patient_id) {
    return res.status(403).json({ status: 'error', message: 'Patient ID not found in token.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the slot row to prevent double-booking
    const [slots] = await conn.query(
      'SELECT * FROM Doctor_Availability WHERE availability_id = ? FOR UPDATE',
      [availability_id]
    );
    if (slots.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ status: 'error', message: 'Availability slot not found.' });
    }
    if (slots[0].status !== 'AVAILABLE') {
      await conn.rollback(); conn.release();
      return res.status(409).json({ status: 'error', message: 'This slot is no longer available.' });
    }

    // Generate appointment ID
    const appointment_id = await generateNextId('Appointment', 'appointment_id', 'AP', 3);

    // Create the appointment
    await conn.query(
      `INSERT INTO Appointment (appointment_id, patient_id, availability_id, reason, status)
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [appointment_id, patient_id, availability_id, reason || null]
    );

    // Mark the slot as BOOKED
    // Note: The DB trigger trg_appointment_status_update fires on Appointment UPDATE only.
    // The initial INSERT is not an UPDATE, so no audit row is created here — correct behaviour.
    await conn.query(
      `UPDATE Doctor_Availability SET status = 'BOOKED' WHERE availability_id = ?`,
      [availability_id]
    );

    await conn.commit();
    conn.release();

    return res.status(201).json({
      status: 'success',
      message: 'Appointment booked successfully.',
      data: { appointment_id, status: 'PENDING' }
    });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('bookAppointment error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'This slot is already booked.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to book appointment.' });
  }
};

// GET /api/appointments   — patient sees own appointments
const getMyAppointments = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.reason, a.status, a.created_at,
              da.available_date, da.start_time, da.end_time,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization, d.doctor_id,
              dep.department_name
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       JOIN Department dep ON d.department_id = dep.department_id
       WHERE a.patient_id = ?
       ORDER BY da.available_date DESC, da.start_time DESC`,
      [patient_id]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyAppointments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointments.' });
  }
};

// GET /api/appointments/:id  — get single appointment detail
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role, patient_id, doctor_id } = req.user;

    const [rows] = await db.query(
      `SELECT a.appointment_id, a.patient_id, a.reason, a.status, a.created_at,
              da.availability_id, da.available_date, da.start_time, da.end_time,
              da.doctor_id,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization,
              dep.department_name,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              p.phone AS patient_phone, p.email AS patient_email
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       JOIN Department dep ON d.department_id = dep.department_id
       JOIN Patient p ON a.patient_id = p.patient_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found.' });
    }

    const appt = rows[0];

    // Authorization: patient can only see their own, doctor only theirs
    if (role === 'PATIENT' && appt.patient_id !== patient_id) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    if (role === 'DOCTOR' && appt.doctor_id !== doctor_id) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }

    return res.status(200).json({ status: 'success', data: appt });
  } catch (error) {
    console.error('getAppointmentById error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointment.' });
  }
};

// PUT /api/appointments/:id/cancel  — patient cancels own appointment
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { patient_id } = req.user;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM Appointment WHERE appointment_id = ? FOR UPDATE',
      [id]
    );
    if (rows.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ status: 'error', message: 'Appointment not found.' });
    }

    const appt = rows[0];
    if (appt.patient_id !== patient_id) {
      await conn.rollback(); conn.release();
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    if (appt.status === 'COMPLETED' || appt.status === 'CANCELLED') {
      await conn.rollback(); conn.release();
      return res.status(400).json({ status: 'error', message: `Cannot cancel a ${appt.status.toLowerCase()} appointment.` });
    }

    // UPDATE triggers the DB audit trigger automatically
    await conn.query(
      `UPDATE Appointment SET status = 'CANCELLED' WHERE appointment_id = ?`,
      [id]
    );

    // Free up the slot
    await conn.query(
      `UPDATE Doctor_Availability SET status = 'AVAILABLE' WHERE availability_id = ?`,
      [appt.availability_id]
    );

    await conn.commit();
    conn.release();
    return res.status(200).json({ status: 'success', message: 'Appointment cancelled.' });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('cancelAppointment error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to cancel appointment.' });
  }
};

// PUT /api/appointments/:id/status  — doctor updates appointment status
const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { doctor_id } = req.user;

  const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify the appointment belongs to this doctor
    const [rows] = await conn.query(
      `SELECT a.*, da.doctor_id
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       WHERE a.appointment_id = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ status: 'error', message: 'Appointment not found.' });
    }

    if (rows[0].doctor_id !== doctor_id) {
      await conn.rollback(); conn.release();
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }

    // UPDATE triggers the DB audit trigger automatically
    await conn.query(
      'UPDATE Appointment SET status = ? WHERE appointment_id = ?',
      [status, id]
    );

    await conn.commit();
    conn.release();
    return res.status(200).json({ status: 'success', message: `Appointment status updated to ${status}.` });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('updateAppointmentStatus error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to update status.' });
  }
};

// GET /api/appointments/doctor  — doctor sees own appointments
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctor_id } = req.user;
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.reason, a.status, a.created_at,
              da.available_date, da.start_time, da.end_time,
              a.patient_id,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              p.phone AS patient_phone, p.email AS patient_email,
              p.date_of_birth, p.gender, p.blood_group
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Patient p ON a.patient_id = p.patient_id
       WHERE da.doctor_id = ?
       ORDER BY da.available_date DESC, da.start_time DESC`,
      [doctor_id]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDoctorAppointments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointments.' });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  getDoctorAppointments
};
