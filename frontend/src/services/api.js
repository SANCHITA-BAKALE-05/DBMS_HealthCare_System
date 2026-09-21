// ============================================================
// api.js
//
// PURPOSE:
//   This is the single central file for ALL HTTP requests
//   the React frontend makes to the Node.js backend.
//
//   Instead of writing fetch() or axios() calls scattered
//   across every component, everything goes through here.
//   That means if the backend URL changes, you only update
//   it in this one file.
//
// HOW IT WORKS:
//   1. Creates one shared axios instance with the backend URL.
//   2. An interceptor automatically adds the JWT token to
//      every request header — no component needs to do this.
//   3. If the server returns 401 (token expired or invalid),
//      the interceptor automatically logs the user out and
//      redirects to the login page.
//   4. Each section exports a named object (e.g. patientAPI)
//      that groups related API calls together.
//
// ENVIRONMENT VARIABLE:
//   VITE_API_URL — set this in frontend/.env for production
//   e.g. VITE_API_URL=https://your-backend.onrender.com
//   In development, Vite's proxy (vite.config.js) forwards
//   /api requests to http://localhost:5000 automatically,
//   so you don't need to set VITE_API_URL locally.
//
// USAGE EXAMPLE in a React component:
//   import { patientAPI } from '../services/api'
//   const response = await patientAPI.getProfile()
//   const patient = response.data.data
// ============================================================

import axios from 'axios'

// BASE_URL is empty string in development (Vite proxy handles it)
// In production it should be set to the deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Create a reusable axios instance that all API calls share
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// ── REQUEST INTERCEPTOR ──────────────────────────────────────
// This runs BEFORE every request is sent.
// It reads the JWT token from localStorage and adds it to
// the Authorization header as: "Bearer <token>"
// The backend's authMiddleware.js reads this header to verify
// the user is logged in.
api.interceptors.request.use(config => {
  const token = localStorage.getItem('hc_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────
// This runs AFTER every response is received.
// If the server returns HTTP 401 (Unauthorized), it means the
// token has expired or is invalid.
// We automatically clear the stored credentials and send the
// user back to the login page.
api.interceptors.response.use(
  response => response,   // success — just pass the response through
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hc_token')
      localStorage.removeItem('hc_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================================
// Auth API
// Handles login, registration, and fetching the current user.
// These routes do NOT require authentication (except getMe).
// ============================================================
export const authAPI = {
  // Create a new patient account
  register: (data) => api.post('/api/auth/register', data),
  // Log in and receive a JWT token
  login:    (data) => api.post('/api/auth/login', data),
  // Get the currently logged-in user's profile (requires token)
  getMe:    ()     => api.get('/api/auth/me')
}

// ============================================================
// Patient API
// For the logged-in patient to manage their own profile.
// ============================================================
export const patientAPI = {
  getProfile:    ()     => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data)
}

// ============================================================
// Doctor API
// Used in the patient-facing doctor search and booking flow,
// and by doctors to manage their own profile and availability.
// ============================================================
export const doctorAPI = {
  // Get list of doctors (optionally filtered by department/specialization)
  getAll:            (params) => api.get('/api/doctors', { params }),
  // Get one doctor's full profile (for the booking/detail page)
  getById:           (id)     => api.get(`/api/doctors/${id}`),
  // Get available time slots for a specific doctor on a given date
  getAvailability:   (id, params) => api.get(`/api/doctors/${id}/availability`, { params }),
  // Doctor managing their own profile
  getProfile:        ()       => api.get('/api/doctors/profile'),
  // Doctor viewing all their own time slots
  getMyAvailability: ()       => api.get('/api/doctors/my-availability'),
  // Doctor adding a new time slot
  addSlot:           (data)   => api.post('/api/doctors/my-availability', data),
  // Doctor removing a time slot
  removeSlot:        (id)     => api.delete(`/api/doctors/my-availability/${id}`)
}

// ============================================================
// Department API
// ============================================================
export const departmentAPI = {
  // Get all departments (used in the patient Departments page)
  getAll: () => api.get('/api/departments'),
  // Admin: create a new department
  create: (data) => api.post('/api/departments', data)
}

// ============================================================
// Appointment API
// Booking, viewing, cancelling, and status updates.
// ============================================================
export const appointmentAPI = {
  // Patient books a new appointment
  book:           (data) => api.post('/api/appointments', data),
  // Patient views their own appointments
  getMyList:      ()     => api.get('/api/appointments'),
  // Doctor views appointments assigned to them
  getDoctorList:  ()     => api.get('/api/appointments/doctor'),
  // Get a single appointment's full details
  getById:        (id)   => api.get(`/api/appointments/${id}`),
  // Patient cancels their own appointment
  cancel:         (id)   => api.put(`/api/appointments/${id}/cancel`),
  // Doctor updates appointment status (CONFIRMED / COMPLETED / CANCELLED)
  updateStatus:   (id, status) => api.put(`/api/appointments/${id}/status`, { status })
}

// ============================================================
// Medical Records API
// Doctors create records; patients view their own records.
// ============================================================
export const medicalRecordAPI = {
  // Patient views their own medical records
  getMine:          ()           => api.get('/api/medical-records'),
  // Doctor views a specific patient's records
  getForPatient:    (patientId)  => api.get(`/api/medical-records/patient/${patientId}`),
  // Doctor creates a new medical record after an appointment
  create:           (data)       => api.post('/api/medical-records', data)
}

// ============================================================
// Prescriptions API
// ============================================================
export const prescriptionAPI = {
  // Patient views their own prescriptions
  getMine:       ()          => api.get('/api/prescriptions'),
  // Doctor views a specific patient's prescriptions
  getForPatient: (patientId) => api.get(`/api/prescriptions/patient/${patientId}`),
  // Doctor creates a new prescription
  create:        (data)      => api.post('/api/prescriptions', data)
}

// ============================================================
// Payments API
// ============================================================
export const paymentAPI = {
  // Patient views their own payment history
  getMine: () => api.get('/api/payments')
}

// ============================================================
// Feedback API
// Patients can submit ratings and comments after appointments.
// ============================================================
export const feedbackAPI = {
  // Patient submits feedback for a completed appointment
  submit:  (data) => api.post('/api/feedback', data),
  // Patient views their own submitted feedback
  getMine: ()     => api.get('/api/feedback/my')
}

// ============================================================
// Admin API
// Admin-only endpoints for managing the entire system.
// All these routes require the ADMIN role JWT token.
// ============================================================
export const adminAPI = {
  // Patient management
  getPatients:          ()         => api.get('/api/admin/patients'),
  updatePatientStatus:  (id, data) => api.put(`/api/admin/patients/${id}/status`, data),
  // Doctor management
  getDoctors:           ()         => api.get('/api/admin/doctors'),
  createDoctor:         (data)     => api.post('/api/admin/doctors', data),
  // View all system appointments
  getAppointments:      ()         => api.get('/api/admin/appointments'),
  // View all payments in the system
  getPayments:          ()         => api.get('/api/admin/payments'),
  // View all patient feedback
  getFeedback:          ()         => api.get('/api/admin/feedback'),
  // View the appointment status change audit log
  getAudit:             (params)   => api.get('/api/admin/audit', { params }),
  // View all doctor availability slots
  getAvailability:      ()         => api.get('/api/admin/availability')
}

// ============================================================
// Analytics API
// All these routes require the ADMIN role.
// They power the charts and KPI cards on the Analytics Dashboard.
// ============================================================
export const analyticsAPI = {
  // KPI summary cards (total patients, doctors, revenue, etc.)
  getSummary:           () => api.get('/api/analytics/summary'),
  // Appointment count grouped by status (PENDING, COMPLETED, etc.)
  getAppointments:      () => api.get('/api/analytics/appointments'),
  // Appointment count grouped by department
  getDepartments:       () => api.get('/api/analytics/departments'),
  // Doctor workload and ratings
  getDoctors:           () => api.get('/api/analytics/doctors'),
  // Revenue grouped by payment method
  getRevenue:           () => api.get('/api/analytics/revenue'),
  // Patient age groups and multi-visit patients
  getPatients:          () => api.get('/api/analytics/patients'),
  // Average health measurements from medical records
  getHealthMetrics:     () => api.get('/api/analytics/health-metrics'),
  // Monthly appointment counts for the trend line chart
  getAppointmentTrend:  () => api.get('/api/analytics/appointment-trend'),
  // Patient count grouped by gender
  getGenderDistribution:() => api.get('/api/analytics/gender-distribution'),
  // Payment count and amount grouped by payment status
  getPaymentStatus:     () => api.get('/api/analytics/payment-status')
}

// ============================================================
// ML Predictions API
// These call the Node backend which proxies to the Python
// Flask ML service. The ML service loads .pkl model files
// and returns probability scores.
//
// IMPORTANT: Results are risk ESTIMATES, NOT medical diagnoses.
// ============================================================
export const mlAPI = {
  // Estimate diabetes risk (features: Age, Sex, BMI, HighBP)
  diabetes:       (data) => api.post('/api/ml/diabetes', data),
  // Estimate hypertension risk (12 cardiovascular risk features)
  hypertension:   (data) => api.post('/api/ml/hypertension', data),
  // Estimate cardiovascular disease risk (13 clinical features)
  cardiovascular: (data) => api.post('/api/ml/cardiovascular', data),
  // Predict obesity category (8 numeric + 8 lifestyle features)
  obesity:        (data) => api.post('/api/ml/obesity', data)
}

export default api
