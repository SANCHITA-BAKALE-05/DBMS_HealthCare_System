// ============================================================
// paymentController.js
//
// PURPOSE:
//   Handles payment record retrieval for patients.
//   A patient can view their own payment history.
//
// DATABASE TABLE USED:
//   Payment
//     payment_id          — unique ID like 'PAY001'
//     appointment_id      — links to which appointment was paid for
//     amount              — how much was charged (DECIMAL)
//     payment_method      — CASH, CARD, UPI, or ONLINE
//     payment_status      — PENDING, PAID, FAILED, or REFUNDED
//     transaction_reference — external reference number (optional)
//     payment_date        — when the payment was recorded
//
// The query JOINs multiple tables to also return doctor name
// and appointment details alongside the payment record,
// so the patient sees a complete picture in one API call.
// ============================================================

const db = require('../config/db');

// ============================================================
// GET /api/payments
//
// Returns all payment records for the currently logged-in patient.
//
// Why multiple JOINs are needed:
//   Payment only stores appointment_id (not patient_id directly).
//   To find payments for this patient we must:
//     Payment → Appointment  (to confirm the appointment belongs to this patient)
//     Appointment → Doctor_Availability  (to get the appointment date)
//     Doctor_Availability → Doctor  (to get the doctor's name)
//
// ORDER BY payment_date DESC shows the most recent payments first.
// ============================================================
const getMyPayments = async (req, res) => {
  try {
    // patient_id comes from the JWT token — patients can only
    // see their own payments, never another patient's
    const { patient_id } = req.user;

    const [rows] = await db.query(
      `SELECT pay.payment_id,
              pay.amount,
              pay.payment_method,
              pay.payment_status,
              pay.transaction_reference,
              pay.payment_date,
              a.appointment_id,
              a.reason,
              a.status              AS appointment_status,
              da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
       FROM Payment pay
       JOIN Appointment a          ON pay.appointment_id  = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id   = da.availability_id
       JOIN Doctor d               ON da.doctor_id        = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY pay.payment_date DESC`,
      [patient_id]
    );

    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getMyPayments error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch payments.' });
  }
};

module.exports = { getMyPayments };
