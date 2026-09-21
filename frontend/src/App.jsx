// ============================================================
// App.jsx
// Root component — sets up React Router with role-based
// protected routes for PATIENT, DOCTOR, and ADMIN.
// ============================================================

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

// Auth pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard'
import DoctorSearch     from './pages/patient/DoctorSearch'
import DoctorDetail     from './pages/patient/DoctorDetail'
import Departments      from './pages/patient/Departments'
import MyAppointments   from './pages/patient/MyAppointments'
import MedicalRecords   from './pages/patient/MedicalRecords'
import Prescriptions    from './pages/patient/Prescriptions'
import Payments         from './pages/patient/Payments'
import Feedback         from './pages/patient/Feedback'
import PatientProfile   from './pages/patient/PatientProfile'
import MLPrediction     from './pages/patient/MLPrediction'

// Doctor pages
import DoctorDashboard    from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import ManageAvailability from './pages/doctor/ManageAvailability'
import DoctorProfile      from './pages/doctor/DoctorProfile'

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import ManagePatients   from './pages/admin/ManagePatients'
import ManageDoctors    from './pages/admin/ManageDoctors'
import {
  AdminAppointments, AdminPayments, AdminFeedback, AdminAudit, AdminDepartments
} from './pages/admin/AdminPages'

const P = ['PATIENT']
const D = ['DOCTOR']
const A = ['ADMIN']

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/"         element={<Navigate to="/login" replace />} />

        {/* Patient */}
        <Route path="/patient/dashboard"    element={<PrivateRoute allowedRoles={P}><PatientDashboard/></PrivateRoute>} />
        <Route path="/patient/doctors"      element={<PrivateRoute allowedRoles={P}><DoctorSearch/></PrivateRoute>} />
        <Route path="/patient/doctors/:id"  element={<PrivateRoute allowedRoles={P}><DoctorDetail/></PrivateRoute>} />
        <Route path="/patient/departments"  element={<PrivateRoute allowedRoles={P}><Departments/></PrivateRoute>} />
        <Route path="/patient/book"         element={<PrivateRoute allowedRoles={P}><DoctorSearch/></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute allowedRoles={P}><MyAppointments/></PrivateRoute>} />
        <Route path="/patient/records"      element={<PrivateRoute allowedRoles={P}><MedicalRecords/></PrivateRoute>} />
        <Route path="/patient/prescriptions"element={<PrivateRoute allowedRoles={P}><Prescriptions/></PrivateRoute>} />
        <Route path="/patient/payments"     element={<PrivateRoute allowedRoles={P}><Payments/></PrivateRoute>} />
        <Route path="/patient/feedback"     element={<PrivateRoute allowedRoles={P}><Feedback/></PrivateRoute>} />
        <Route path="/patient/profile"      element={<PrivateRoute allowedRoles={P}><PatientProfile/></PrivateRoute>} />
        <Route path="/patient/ml"           element={<PrivateRoute allowedRoles={P}><MLPrediction/></PrivateRoute>} />

        {/* Doctor */}
        <Route path="/doctor/dashboard"    element={<PrivateRoute allowedRoles={D}><DoctorDashboard/></PrivateRoute>} />
        <Route path="/doctor/appointments" element={<PrivateRoute allowedRoles={D}><DoctorAppointments/></PrivateRoute>} />
        <Route path="/doctor/availability" element={<PrivateRoute allowedRoles={D}><ManageAvailability/></PrivateRoute>} />
        <Route path="/doctor/profile"      element={<PrivateRoute allowedRoles={D}><DoctorProfile/></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard"    element={<PrivateRoute allowedRoles={A}><AdminDashboard/></PrivateRoute>} />
        <Route path="/admin/analytics"    element={<PrivateRoute allowedRoles={A}><AnalyticsDashboard/></PrivateRoute>} />
        <Route path="/admin/patients"     element={<PrivateRoute allowedRoles={A}><ManagePatients/></PrivateRoute>} />
        <Route path="/admin/doctors"      element={<PrivateRoute allowedRoles={A}><ManageDoctors/></PrivateRoute>} />
        <Route path="/admin/departments"  element={<PrivateRoute allowedRoles={A}><AdminDepartments/></PrivateRoute>} />
        <Route path="/admin/appointments" element={<PrivateRoute allowedRoles={A}><AdminAppointments/></PrivateRoute>} />
        <Route path="/admin/payments"     element={<PrivateRoute allowedRoles={A}><AdminPayments/></PrivateRoute>} />
        <Route path="/admin/feedback"     element={<PrivateRoute allowedRoles={A}><AdminFeedback/></PrivateRoute>} />
        <Route path="/admin/audit"        element={<PrivateRoute allowedRoles={A}><AdminAudit/></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
