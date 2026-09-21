// ============================================================
// analyticsController.js
// Exposes the existing analytics SQL queries (04_Analytics.sql)
// through REST API endpoints.
//
// Each function maps directly to a named query from that file.
// No new analytics logic is invented here.
// ============================================================

const db = require('../config/db');

// GET /api/analytics/summary
// Queries 1, 2, 7, 17 — key KPI numbers for dashboard cards
const getSummary = async (req, res) => {
  try {
    const [[patientCount]]   = await db.query('SELECT COUNT(*) AS total_patients FROM Patient');
    const [[doctorCount]]    = await db.query('SELECT COUNT(*) AS total_doctors FROM Doctor');
    const [[departmentCount]]= await db.query('SELECT COUNT(*) AS total_departments FROM Department');
    const [[revenue]]        = await db.query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM Payment WHERE payment_status = 'PAID'");
    const [[completion]]     = await db.query(
      `SELECT
         COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_appointments,
         COUNT(*) AS total_appointments,
         ROUND(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS completion_rate_percentage
       FROM Appointment`
    );

    return res.status(200).json({
      status: 'success',
      data: {
        total_patients:     patientCount.total_patients,
        total_doctors:      doctorCount.total_doctors,
        total_departments:  departmentCount.total_departments,
        total_revenue:      parseFloat(revenue.total_revenue),
        total_appointments: completion.total_appointments,
        completed_appointments: completion.completed_appointments,
        completion_rate_percentage: completion.completion_rate_percentage || 0
      }
    });
  } catch (error) {
    console.error('getSummary error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch analytics summary.' });
  }
};

// GET /api/analytics/appointments
// Query 3 — appointment status breakdown
const getAppointmentStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT status, COUNT(*) AS total_appointments
       FROM Appointment GROUP BY status ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getAppointmentStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch appointment stats.' });
  }
};

// GET /api/analytics/departments
// Query 4 — appointments by department
const getDepartmentStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dep.department_name, COUNT(a.appointment_id) AS total_appointments
       FROM Department dep
       JOIN Doctor d ON dep.department_id = d.department_id
       JOIN Doctor_Availability da ON d.doctor_id = da.doctor_id
       JOIN Appointment a ON da.availability_id = a.availability_id
       GROUP BY dep.department_id, dep.department_name
       ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDepartmentStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch department stats.' });
  }
};

// GET /api/analytics/doctors
// Queries 5, 12 — doctor appointment load + average rating
const getDoctorStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.doctor_id,
              CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
              d.specialization,
              COUNT(DISTINCT a.appointment_id) AS total_appointments,
              ROUND(AVG(f.rating), 2) AS average_rating,
              COUNT(DISTINCT f.feedback_id) AS total_feedback
       FROM Doctor d
       LEFT JOIN Doctor_Availability da ON d.doctor_id = da.doctor_id
       LEFT JOIN Appointment a ON da.availability_id = a.availability_id
       LEFT JOIN Feedback f ON a.appointment_id = f.appointment_id
       GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
       ORDER BY total_appointments DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getDoctorStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch doctor stats.' });
  }
};

// GET /api/analytics/revenue
// Query 8 — revenue by payment method
const getRevenueStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT payment_method,
              COUNT(payment_id) AS total_transactions,
              SUM(amount) AS total_revenue
       FROM Payment WHERE payment_status = 'PAID'
       GROUP BY payment_method ORDER BY total_revenue DESC`
    );
    return res.status(200).json({ status: 'success', data: rows });
  } catch (error) {
    console.error('getRevenueStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch revenue stats.' });
  }
};

// GET /api/analytics/patients
// Queries 10, 14, 18 — patients with multiple visits, records count, age groups
const getPatientStats = async (req, res) => {
  try {
    const [ageGroups] = await db.query(
      `SELECT
         CASE
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Below 18'
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 40 THEN '18-40'
           WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 60 THEN '41-60'
           ELSE 'Above 60'
         END AS age_group,
         COUNT(*) AS total_patients
       FROM Patient GROUP BY age_group ORDER BY total_patients DESC`
    );

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

    const [medicines] = await db.query(
      `SELECT medicine_name, COUNT(*) AS prescription_count
       FROM Prescription_Item
       GROUP BY medicine_name ORDER BY prescription_count DESC LIMIT 10`
    );

    return res.status(200).json({
      status: 'success',
      data: { age_groups: ageGroups, multi_visit_patients: multiVisit, top_medicines: medicines }
    });
  } catch (error) {
    console.error('getPatientStats error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch patient stats.' });
  }
};

// GET /api/analytics/health-metrics
// Query 13 — average health measurements from medical records
const getHealthMetrics = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         ROUND(AVG(blood_sugar), 2) AS average_blood_sugar,
         ROUND(AVG(heart_rate), 2)  AS average_heart_rate,
         ROUND(AVG(weight), 2)      AS average_weight
       FROM Medical_Record`
    );
    return res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    console.error('getHealthMetrics error:', error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch health metrics.' });
  }
};

module.exports = {
  getSummary,
  getAppointmentStats,
  getDepartmentStats,
  getDoctorStats,
  getRevenueStats,
  getPatientStats,
  getHealthMetrics
};
