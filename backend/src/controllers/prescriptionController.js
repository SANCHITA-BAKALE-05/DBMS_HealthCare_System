// ============================================================
// prescriptionController.js
// Tables: Prescription, Prescription_Item, Medical_Record
//
// Prescription columns:
//   prescription_id, record_id (UNIQUE FK), prescription_date,
//   instructions, created_at
//
// Prescription_Item columns:
//   prescription_item_id, prescription_id, medicine_name,
//   dosage, frequency, duration, instructions
// ============================================================

const db = require('../config/db');
const { generateNextId } = require('../utils/idGenerator');

// GET /api/prescriptions  — patient sees own prescriptions
const getMyPrescriptions = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const [rows] = await db.query(
      `SELECT pr.prescription_id, pr.prescription_date, pr.instructions,
              pr.created_at,
              mr.record_id, mr.diagnosis,
              da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization
       FROM Prescription pr
       JOIN Medical_Record mr ON pr.record_id = mr.record_id
       JOIN Appointment a ON mr.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       WHERE mr.patient_id = ?
       ORDER BY pr.created_at DESC`,
      [patient_id]
    );

    // For each prescription, fetch its items
    for (const presc of rows) {
      const [items] = await db.query(
        `SELECT prescription_item_id, medicine_name, dosage, frequency, duration, instructions
         FROM Prescription_Item WHERE prescription_id = ?`,
        [presc.prescription_id]
      );
      presc.items = items;
    }

    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyPrescriptions error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch prescriptions.' });
  }
};

// GET /api/prescriptions/patient/:patientId  — doctor views patient prescriptions
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctor_id, role } = req.user;

    if (role === 'DOCTOR') {
      const [check] = await db.query(
        `SELECT a.appointment_id FROM Appointment a
         JOIN Doctor_Availability da ON a.availability_id = da.availability_id
         WHERE a.patient_id = ? AND da.doctor_id = ? LIMIT 1`,
        [patientId, doctor_id]
      );
      if (check.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Access denied.' });
      }
    }

    const [rows] = await db.query(
      `SELECT pr.prescription_id, pr.prescription_date, pr.instructions,
              mr.record_id, mr.diagnosis, da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
       FROM Prescription pr
       JOIN Medical_Record mr ON pr.record_id = mr.record_id
       JOIN Appointment a ON mr.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       WHERE mr.patient_id = ?
       ORDER BY pr.created_at DESC`,
      [patientId]
    );

    for (const presc of rows) {
      const [items] = await db.query(
        'SELECT * FROM Prescription_Item WHERE prescription_id = ?',
        [presc.prescription_id]
      );
      presc.items = items;
    }

    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getPatientPrescriptions error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch prescriptions.' });
  }
};

// POST /api/prescriptions  — doctor creates a prescription
const createPrescription = async (req, res) => {
  try {
    const { doctor_id } = req.user;
    const { record_id, prescription_date, instructions, items } = req.body;

    if (!record_id || !prescription_date) {
      return res.status(400).json({ status: 'error', message: 'record_id and prescription_date are required.' });
    }

    // Verify the record belongs to an appointment of this doctor
    const [record] = await db.query(
      `SELECT mr.patient_id, da.doctor_id
       FROM Medical_Record mr
       JOIN Appointment a ON mr.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       WHERE mr.record_id = ?`,
      [record_id]
    );

    if (record.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Medical record not found.' });
    }
    if (record[0].doctor_id !== doctor_id) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }

    const prescription_id = await generateNextId('Prescription', 'prescription_id', 'PR', 3);

    await db.query(
      `INSERT INTO Prescription (prescription_id, record_id, prescription_date, instructions)
       VALUES (?, ?, ?, ?)`,
      [prescription_id, record_id, prescription_date, instructions || null]
    );

    // Insert items if provided
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.medicine_name) continue;
        const item_id = await generateNextId('Prescription_Item', 'prescription_item_id', 'PI', 3);
        await db.query(
          `INSERT INTO Prescription_Item
           (prescription_item_id, prescription_id, medicine_name, dosage, frequency, duration, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [item_id, prescription_id, item.medicine_name, item.dosage || null,
           item.frequency || null, item.duration || null, item.instructions || null]
        );
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Prescription created.',
      data: { prescription_id }
    });
  } catch (error) {
    console.error('createPrescription error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'A prescription already exists for this record.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to create prescription.' });
  }
};

module.exports = { getMyPrescriptions, getPatientPrescriptions, createPrescription };
