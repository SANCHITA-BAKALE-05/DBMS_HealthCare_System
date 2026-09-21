// ============================================================
// paymentController.js
// Table: Payment
//   payment_id, appointment_id, amount, payment_method,
//   payment_status, transaction_reference, payment_date
// ============================================================

const db = require('../config/db');

// GET /api/payments  — patient sees own payment records
const getMyPayments = async (req, res) => {
  try {
    const { patient_id } = req.user;
    const [rows] = await db.query(
      `SELECT pay.payment_id, pay.amount, pay.payment_method,
              pay.payment_status, pay.transaction_reference, pay.payment_date,
              a.appointment_id, a.reason, a.status AS appointment_status,
              da.available_date,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name
       FROM Payment pay
       JOIN Appointment a ON pay.appointment_id = a.appointment_id
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       JOIN Doctor d ON da.doctor_id = d.doctor_id
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
