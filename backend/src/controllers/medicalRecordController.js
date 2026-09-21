// ============================================================
// medicalRecordController.js
// Tables: Medical_Record, Appointment, Patient
//
// Medical_Record columns:
//   record_id, patient_id, appointment_id (UNIQUE),
//   symptoms, diagnosis, blood_pressure, blood_sugar,
//   heart_rate, weight, doctor_notes, recorded_at
// ============================================================

const db = require('../config/db');
const { generateNextId } = require('../utils/idGenerator');

// GET /api/medical-records  — patient sees own records
const getMyMedicalRecords = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const [rows] = await db.query(
      `SELECT mr.record_id, mr.appointment_id, mr.symptoms, mr.diagnosis,
              mr.blood_pressure, mr.blood_sugar, mr.heart_rate, mr.weight,
              mr.doctor_notes, mr.recorded_at,
              da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization
       FROM Medical_Record mr
       JOIN Appointment a ON mr.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       WHERE mr.patient_id = ?
       ORDER BY mr.recorded_at DESC`,
      [patient_id]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyMedicalRecords error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch medical records.' });
  }
};

// GET /api/medical-records/patient/:patientId  — doctor views a patient's records
const getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctor_id, role } = req.user;

    // If doctor, verify they have at least one appointment with this patient
    if (role === 'DOCTOR') {
      const [check] = await db.query(
        `SELECT a.appointment_id FROM Appointment a
         JOIN Doctor_Availability da ON a.availability_id = da.availability_id
         WHERE a.patient_id = ? AND da.doctor_id = ? LIMIT 1`,
        [patientId, doctor_id]
      );
      if (check.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Access denied. No appointment with this patient.' });
      }
    }

    const [rows] = await db.query(
      `SELECT mr.record_id, mr.appointment_id, mr.symptoms, mr.diagnosis,
              mr.blood_pressure, mr.blood_sugar, mr.heart_rate, mr.weight,
              mr.doctor_notes, mr.recorded_at,
              da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization
       FROM Medical_Record mr
       JOIN Appointment a ON mr.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       WHERE mr.patient_id = ?
       ORDER BY mr.recorded_at DESC`,
      [patientId]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getPatientMedicalRecords error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch records.' });
  }
};

// POST /api/medical-records  — doctor creates a record for a completed appointment
const createMedicalRecord = async (req, res) => {
  try {
    const { doctor_id } = req.user;
    const {
      appointment_id, symptoms, diagnosis,
      blood_pressure, blood_sugar, heart_rate, weight, doctor_notes
    } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ status: 'error', message: 'appointment_id is required.' });
    }

    // Verify the appointment belongs to this doctor and is COMPLETED or CONFIRMED
    const [appt] = await db.query(
      `SELECT a.patient_id, a.status, da.doctor_id
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       WHERE a.appointment_id = ?`,
      [appointment_id]
    );

    if (appt.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found.' });
    }
    if (appt[0].doctor_id !== doctor_id) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    if (!['COMPLETED', 'CONFIRMED'].includes(appt[0].status)) {
      return res.status(400).json({ status: 'error', message: 'Medical record can only be added for CONFIRMED or COMPLETED appointments.' });
    }

    const record_id = await generateNextId('Medical_Record', 'record_id', 'R', 3);

    await db.query(
      `INSERT INTO Medical_Record
       (record_id, patient_id, appointment_id, symptoms, diagnosis,
        blood_pressure, blood_sugar, heart_rate, weight, doctor_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record_id, appt[0].patient_id, appointment_id, symptoms || null,
       diagnosis || null, blood_pressure || null, blood_sugar || null,
       heart_rate || null, weight || null, doctor_notes || null]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Medical record created.',
      data: { record_id }
    });
  } catch (error) {
    console.error('createMedicalRecord error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'A medical record already exists for this appointment.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create medical record.' });
  }
};

module.exports = { getMyMedicalRecords, getPatientMedicalRecords, createMedicalRecord };
