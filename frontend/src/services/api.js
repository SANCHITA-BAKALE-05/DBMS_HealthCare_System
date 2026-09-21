// ============================================================
// api.js
// Central Axios instance for all backend API calls.
// Automatically attaches the JWT token to every request.
// ============================================================

import axios from 'axios'

// In development, Vite proxies /api → http://localhost:5000
// In production, set VITE_API_URL to the deployed backend URL
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every outgoing request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('hc_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// If the server returns 401 (token expired/invalid), log out
api.interceptors.response.use(
  response => response,
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
// Auth
// ============================================================
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  getMe:    ()     => api.get('/api/auth/me')
}

// ============================================================
// Patient
// ============================================================
export const patientAPI = {
  getProfile:    ()     => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data)
}

// ============================================================
// Doctors
// ============================================================
export const doctorAPI = {
  getAll:           (params) => api.get('/api/doctors', { params }),
  getById:          (id)     => api.get(`/api/doctors/${id}`),
  getAvailability:  (id, params) => api.get(`/api/doctors/${id}/availability`, { params }),
  getProfile:       ()       => api.get('/api/doctors/profile'),
  getMyAvailability:()       => api.get('/api/doctors/my-availability'),
  addSlot:          (data)   => api.post('/api/doctors/my-availability', data),
  removeSlot:       (id)     => api.delete(`/api/doctors/my-availability/${id}`)
}

// ============================================================
// Departments
// ============================================================
export const departmentAPI = {
  getAll: () => api.get('/api/departments'),
  create: (data) => api.post('/api/departments', data)
}

// ============================================================
// Appointments
// ============================================================
export const appointmentAPI = {
  book:           (data) => api.post('/api/appointments', data),
  getMyList:      ()     => api.get('/api/appointments'),
  getDoctorList:  ()     => api.get('/api/appointments/doctor'),
  getById:        (id)   => api.get(`/api/appointments/${id}`),
  cancel:         (id)   => api.put(`/api/appointments/${id}/cancel`),
  updateStatus:   (id, status) => api.put(`/api/appointments/${id}/status`, { status })
}

// ============================================================
// Medical Records
// ============================================================
export const medicalRecordAPI = {
  getMine:          ()           => api.get('/api/medical-records'),
  getForPatient:    (patientId)  => api.get(`/api/medical-records/patient/${patientId}`),
  create:           (data)       => api.post('/api/medical-records', data)
}

// ============================================================
// Prescriptions
// ============================================================
export const prescriptionAPI = {
  getMine:       ()          => api.get('/api/prescriptions'),
  getForPatient: (patientId) => api.get(`/api/prescriptions/patient/${patientId}`),
  create:        (data)      => api.post('/api/prescriptions', data)
}

// ============================================================
// Payments
// ============================================================
export const paymentAPI = {
  getMine: () => api.get('/api/payments')
}

// ============================================================
// Feedback
// ============================================================
export const feedbackAPI = {
  submit:  (data) => api.post('/api/feedback', data),
  getMine: ()     => api.get('/api/feedback/my')
}

// ============================================================
// Admin
// ============================================================
export const adminAPI = {
  getPatients:          ()         => api.get('/api/admin/patients'),
  updatePatientStatus:  (id, data) => api.put(`/api/admin/patients/${id}/status`, data),
  getDoctors:           ()         => api.get('/api/admin/doctors'),
  createDoctor:         (data)     => api.post('/api/admin/doctors', data),
  getAppointments:      ()         => api.get('/api/admin/appointments'),
  getPayments:          ()         => api.get('/api/admin/payments'),
  getFeedback:          ()         => api.get('/api/admin/feedback'),
  getAudit:             (params)   => api.get('/api/admin/audit', { params }),
  getAvailability:      ()         => api.get('/api/admin/availability')
}

// ============================================================
// Analytics
// ============================================================
export const analyticsAPI = {
  getSummary:      () => api.get('/api/analytics/summary'),
  getAppointments: () => api.get('/api/analytics/appointments'),
  getDepartments:  () => api.get('/api/analytics/departments'),
  getDoctors:      () => api.get('/api/analytics/doctors'),
  getRevenue:      () => api.get('/api/analytics/revenue'),
  getPatients:     () => api.get('/api/analytics/patients'),
  getHealthMetrics:() => api.get('/api/analytics/health-metrics')
}

// ============================================================
// ML Predictions
// ============================================================
export const mlAPI = {
  diabetes:       (data) => api.post('/api/ml/diabetes', data),
  hypertension:   (data) => api.post('/api/ml/hypertension', data),
  cardiovascular: (data) => api.post('/api/ml/cardiovascular', data),
  obesity:        (data) => api.post('/api/ml/obesity', data)
}

export default api
