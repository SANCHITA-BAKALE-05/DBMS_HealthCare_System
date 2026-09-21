// Sidebar navigation component used by Patient, Doctor, and Admin layouts

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const patientLinks = [
  { label: 'Dashboard',       path: '/patient/dashboard' },
  { label: 'Find Doctors',    path: '/patient/doctors' },
  { label: 'Departments',     path: '/patient/departments' },
  { label: 'Book Appointment',path: '/patient/book' },
  { label: 'My Appointments', path: '/patient/appointments' },
  { label: 'Medical Records', path: '/patient/records' },
  { label: 'Prescriptions',   path: '/patient/prescriptions' },
  { label: 'Payments',        path: '/patient/payments' },
  { label: 'Feedback',        path: '/patient/feedback' },
  { label: 'Health Risk Check',path: '/patient/ml' },
  { label: 'Profile',         path: '/patient/profile' },
]

const doctorLinks = [
  { label: 'Dashboard',       path: '/doctor/dashboard' },
  { label: 'My Appointments', path: '/doctor/appointments' },
  { label: 'My Availability', path: '/doctor/availability' },
  { label: 'Profile',         path: '/doctor/profile' },
]

const adminLinks = [
  { label: 'Dashboard',       path: '/admin/dashboard' },
  { label: 'Analytics',       path: '/admin/analytics' },
  { label: 'Patients',        path: '/admin/patients' },
  { label: 'Doctors',         path: '/admin/doctors' },
  { label: 'Departments',     path: '/admin/departments' },
  { label: 'Appointments',    path: '/admin/appointments' },
  { label: 'Payments',        path: '/admin/payments' },
  { label: 'Feedback',        path: '/admin/feedback' },
  { label: 'Audit Log',       path: '/admin/audit' },
]

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const links =
    user?.role === 'PATIENT' ? patientLinks :
    user?.role === 'DOCTOR'  ? doctorLinks  :
    adminLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">🏥 Healthcare</div>
      <nav className="sidebar-nav">
        {links.map(link => (
          <div
            key={link.path}
            className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          Logged in as <strong>{user?.username}</strong><br />
          <span style={{ fontSize: 11 }}>{user?.role}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar
