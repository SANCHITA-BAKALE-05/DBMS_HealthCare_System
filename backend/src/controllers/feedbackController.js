// ============================================================
// feedbackController.js
// Table: Feedback
//   feedback_id, appointment_id (UNIQUE), rating (1-5), comments
// ============================================================

const db = require('../config/db');
const { generateNextId } = require('../utils/idGenerator');

// POST /api/feedback  — patient submits feedback for a completed appointment
const submitFeedback = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const { appointment_id, rating, comments } = req.body;

    if (!appointment_id || !rating) {
      return res.status(400).json({ status: 'error', message: 'appointment_id and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5.' });
    }

    // Verify the appointment belongs to this patient and is COMPLETED
    const [appt] = await db.query(
      'SELECT patient_id, status FROM Appointment WHERE appointment_id = ?',
      [appointment_id]
    );
    if (appt.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Appointment not found.' });
    }
    if (appt[0].patient_id !== patient_id) {
      return res.status(403).json({ status: 'error', message: 'Access denied.' });
    }
    if (appt[0].status !== 'COMPLETED') {
      return res.status(400).json({ status: 'error', message: 'Feedback can only be submitted for completed appointments.' });
    }

    const feedback_id = await generateNextId('Feedback', 'feedback_id', 'F', 3);

    await db.query(
      `INSERT INTO Feedback (feedback_id, appointment_id, rating, comments)
       VALUES (?, ?, ?, ?)`,
      [feedback_id, appointment_id, rating, comments || null]
    );

    return res.status(201).json({ status: 'success', message: 'Feedback submitted. Thank you!', data: { feedback_id } });
  } catch (error) {
    console.error('submitFeedback error:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ status: 'error', message: 'Feedback already submitted for this appointment.' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to submit feedback.' });
  }
};

// GET /api/feedback/my  — patient sees own feedback history
const getMyFeedback = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const [rows] = await db.query(
      `SELECT f.feedback_id, f.rating, f.comments, f.created_at,
              a.appointment_id, da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization
       FROM Feedback f
       JOIN Appointment a ON f.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY f.created_at DESC`,
      [patient_id]
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyFeedback error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch feedback.' });
  }
};

module.exports = { submitFeedback, getMyFeedback };
