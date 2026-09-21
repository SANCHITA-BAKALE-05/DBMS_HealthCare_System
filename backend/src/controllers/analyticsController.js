// ============================================================
// analyticsController.js
//
// PURPOSE:
//   This file provides all the data that powers the Admin
//   Analytics Dashboard charts and KPI cards.
//
//   Each function runs an SQL query against the MySQL database
//   and returns the results as JSON to the frontend.
//
// HOW IT FITS IN THE PROJECT:
//   MySQL Database
//       ↓  (SQL query runs here)
//   analyticsController.js   ← YOU ARE HERE
//       ↓  (JSON response)
//   analyticsRoutes.js  (defines the URL paths)
//       ↓
//   React AnalyticsDashboard.jsx  (draws the charts)
//
// ALL routes in this file require ADMIN login.
// ============================================================

const db = require('../config/db');

// ============================================================
// GET /api/analytics/summary
//
// Returns the top-level KPI numbers shown as summary cards
// on the admin dashboard:
//   - Total patients registered
//   - Total doctors registered
//   - Total departments
//   - Total revenue collected from PAID payments
//   - Total appointments and how many were COMPLETED
//   - Completion rate as a percentage
//
// Runs 5 separate quick queries and bundles all results
// into one response object so the frontend needs just
// one HTTP call to populate all the KPI cards.
// ============================================================
const getSummary = async (req, res) => {
  try {
    // COUNT(*) counts every row in the table
    const [[patientCount]]    = await db.query('SELECT COUNT(*) AS total_patients FROM Patient');
    const [[doctorCount]]     = await db.query('SELECT COUNT(*) AS total_doctors FROM Doctor');
    const [[departmentCount]] = await db.query('SELECT COUNT(*) AS total_departments FROM Department');

    // SUM(amount) adds up money only where payment was completed (status = 'PAID')
    // COALESCE(..., 0) returns 0 instead of NULL if there are no paid payments yet
    const [[revenue]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM Payment WHERE payment_status = 'PAID'"
    );

    // CASE WHEN counts only rows that match a condition (like COUNT with a filter)
    // NULLIF prevents division-by-zero when there are no appointments yet
    const [[completion]] = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_appointments,
         COUNT(*) AS total_appointments,
         ROUND(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS completion_rate_percentage
       FROM Appointment`
    );

    return res.status(200).json({
      status: 'success',
      data: {
        total_patients:              patientCount.total_patients,
        total_doctors:               doctorCount.total_doctors,
        total_departments:           departmentCount.total_departments,
        total_revenue:               parseFloat(revenue.total_revenue),
        total_appointments:          completion.total_appointments,
        completed_appointments:      completion.completed_appointments,
        completion_rate_percentage:  completion.completion_rate_percentage || 0
      }
    });
  } catch (error) {
    console.error('getSummary error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch analytics summary.' });
  }
};

// ============================================================
// GET /api/analytics/appointments
//
// Returns the count of appointments for each status value.
// The Appointment table has 4 possible statuses:
//   PENDING, CONFIRMED, COMPLETED, CANCELLED
//
// Example result:
//   [ { status: 'COMPLETED', total_appointments: 8 },
//     { status: 'PENDING',   total_appointments: 3 } ]
//
// This data is used to draw the Appointment Status
// Donut Pie Chart on the analytics dashboard.
// ============================================================
const getAppointmentStats = async (req, res) => {
  try {
    // GROUP BY groups all rows with the same status together
    // COUNT(*) then counts how many rows are in each group
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS total_appointments
       FROM Appointment
       GROUP BY status
       ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAppointmentStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointment stats.' });
  }
};

// ============================================================
// GET /api/analytics/departments
//
// Returns the number of appointments per department.
//
// Why the JOINs are needed:
//   - Appointment only stores availability_id (not department)
//   - Doctor_Availability links appointment to a doctor
//   - Doctor links to Department
//   So we follow: Appointment → Availability → Doctor → Department
//
// This data powers the "Appointments by Department" Bar Chart.
// ============================================================
const getDepartmentStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dep.department_name,
              COUNT(a.appointment_id) AS total_appointments
       FROM Department dep
       JOIN Doctor d            ON dep.department_id   = d.department_id
       JOIN Doctor_Availability da ON d.doctor_id      = da.doctor_id
       JOIN Appointment a       ON da.availability_id  = a.availability_id
       GROUP BY dep.department_id, dep.department_name
       ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDepartmentStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch department stats.' });
  }
};

// ============================================================
// GET /api/analytics/doctors
//
// Returns one row per doctor showing:
//   - How many appointments they have (workload)
//   - Their average patient feedback rating (1–5)
//   - How many feedback entries they have received
//
// LEFT JOIN is used instead of JOIN so that doctors who
// have NO appointments or NO feedback still appear in
// the result (with 0 counts instead of being hidden).
//
// This data powers the Doctor Workload Bar Chart and
// the Doctor Performance table.
// ============================================================
const getDoctorStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.doctor_id,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization,
              COUNT(DISTINCT a.appointment_id)   AS total_appointments,
              ROUND(AVG(f.rating), 2)            AS average_rating,
              COUNT(DISTINCT f.feedback_id)      AS total_feedback
       FROM Doctor d
       LEFT JOIN Doctor_Availability da ON d.doctor_id       = da.doctor_id
       LEFT JOIN Appointment a          ON da.availability_id = a.availability_id
       LEFT JOIN Feedback f             ON a.appointment_id   = f.appointment_id
       GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
       ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDoctorStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctor stats.' });
  }
};

// ============================================================
// GET /api/analytics/revenue
//
// Returns revenue broken down by payment method
// (CASH, CARD, UPI, ONLINE).
//
// Only PAID payments are counted — PENDING or FAILED
// payments do not contribute to revenue.
//
// This data powers the "Revenue by Payment Method" Bar Chart.
// ============================================================
const getRevenueStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT payment_method,
              COUNT(payment_id)  AS total_transactions,
              SUM(amount)        AS total_revenue
       FROM Payment
       WHERE payment_status = 'PAID'
       GROUP BY payment_method
       ORDER BY total_revenue DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getRevenueStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch revenue stats.' });
  }
};

// ============================================================
// GET /api/analytics/patients
//
// Returns three different patient statistics in one call:
//
// 1. age_groups — patients bucketed into age ranges using
//    TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) to
//    calculate current age from the birth date.
//    Used for the Patient Age Group Bar Chart.
//
// 2. multi_visit_patients — patients who have booked more
//    than one appointment (HAVING COUNT > 1).
//    Useful for identifying returning patients.
//
// 3. top_medicines — the 10 most frequently prescribed
//    medicines across all prescriptions.
//    Useful for pharmacy/supply planning.
// ============================================================
const getPatientStats = async (req, res) => {
  try {
    // CASE WHEN acts like an if-else: assigns each patient to an age group
    const [ageGroups] = await db.query(
      `SELECT
         CASE
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Below 18'
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 40 THEN '18-40'
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 60 THEN '41-60'
           ELSE 'Above 60'
         END AS age_group,
         COUNT(*) AS total_patients
       FROM Patient
       GROUP BY age_group
       ORDER BY total_patients DESC`
    );

    // HAVING is like WHERE but used after GROUP BY
    // Here it filters to only patients with more than 1 appointment
    const [multiVisit] = await db.query(
      `SELECT p.patient_id,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              COUNT(a.appointment_id) AS total_appointments
       FROM Patient p
       JOIN Appointment a ON p.patient_id = a.patient_id
       GROUP BY p.patient_id, p.first_name, p.last_name
       HAVING COUNT(a.appointment_id) > 1
       ORDER BY total_appointments DESC`
    );

    // LIMIT 10 returns only the top 10 most prescribed medicines
    const [medicines] = await db.query(
      `SELECT medicine_name, COUNT(*) AS prescription_count
       FROM Prescription_Item
       GROUP BY medicine_name
       ORDER BY prescription_count DESC
       LIMIT 10`
    );

    return res.status(200).json({
      status: 'success',
      data: {
        age_groups:           ageGroups,
        multi_visit_patients: multiVisit,
        top_medicines:        medicines
      }
    });
  } catch (error) {
    console.error('getPatientStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch patient stats.' });
  }
};

// ============================================================
// GET /api/analytics/health-metrics
//
// Returns average health measurements recorded across
// all Medical_Record entries in the database:
//   - Average blood sugar level
//   - Average heart rate
//   - Average patient weight
//
// AVG() is a standard SQL aggregate function — it adds up
// all values in a column and divides by the number of rows.
// ROUND(..., 2) limits the result to 2 decimal places.
// ============================================================
const getHealthMetrics = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         ROUND(AVG(blood_sugar), 2) AS average_blood_sugar,
         ROUND(AVG(heart_rate),  2) AS average_heart_rate,
         ROUND(AVG(weight),      2) AS average_weight
       FROM Medical_Record`
    );
    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getHealthMetrics error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch health metrics.' });
  }
};

// ============================================================
// GET /api/analytics/appointment-trend
//
// Returns monthly appointment counts so the frontend can
// draw a line chart showing how appointment volume changes
// over time.
//
// DATE_FORMAT(date, '%Y-%m') converts a full date like
// '2026-09-15' into a month label like '2026-09'.
// The frontend then formats this further into 'Sep 2026'.
//
// We JOIN Doctor_Availability because that table holds
// the actual appointment date (available_date).
// The Appointment table itself does not store a date —
// it only stores the availability_id (a foreign key).
//
// LIMIT 24 means we return at most the last 24 months of data.
// ============================================================
const getAppointmentTrend = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(da.available_date, '%Y-%m') AS month,
              COUNT(a.appointment_id)                 AS total_appointments
       FROM Appointment a
       JOIN Doctor_Availability da ON a.availability_id = da.availability_id
       GROUP BY month
       ORDER BY month ASC
       LIMIT 24`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAppointmentTrend error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointment trend.' });
  }
};

// ============================================================
// GET /api/analytics/gender-distribution
//
// Returns the count of patients grouped by gender.
// The Patient table stores gender as a VARCHAR so it holds
// whatever value was entered during registration
// (e.g. 'Male', 'Female', 'Other').
//
// GROUP BY gender groups all patients who share the same
// gender value and COUNT(*) tallies each group.
//
// This data powers the Patient Gender Distribution Pie Chart.
// ============================================================
const getGenderDistribution = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT gender, COUNT(*) AS total_patients
       FROM Patient
       GROUP BY gender
       ORDER BY total_patients DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getGenderDistribution error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch gender distribution.' });
  }
};

// ============================================================
// GET /api/analytics/payment-status
//
// Returns counts and total amounts grouped by payment status:
//   PAID, PENDING, FAILED, REFUNDED
//
// This is different from /revenue which only looks at PAID.
// Here we want the full picture — how many payments are still
// pending, how many failed, etc.
//
// COALESCE(SUM(amount), 0) safely returns 0 if there are
// no rows in a group (prevents NULL in the response).
//
// This data powers the "Payment Status Overview" Bar Chart.
// ============================================================
const getPaymentStatus = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT payment_status,
              COUNT(payment_id)        AS total_transactions,
              COALESCE(SUM(amount), 0) AS total_amount
       FROM Payment
       GROUP BY payment_status
       ORDER BY total_transactions DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getPaymentStatus error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch payment status.' });
  }
};

// Export all functions so analyticsRoutes.js can use them
module.exports = {
  getSummary,
  getAppointmentStats,
  getDepartmentStats,
  getDoctorStats,
  getRevenueStats,
  getPatientStats,
  getHealthMetrics,
  getAppointmentTrend,
  getGenderDistribution,
  getPaymentStatus
};
