// ============================================================
// PrivateRoute.jsx
// Protects routes that require authentication.
// Redirects to /login if the user is not logged in.
// Redirects to appropriate dashboard if role doesn't match.
// ============================================================

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />
    if (user.role === 'DOCTOR')  return <Navigate to="/doctor/dashboard" replace />
    if (user.role === 'ADMIN')   return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default PrivateRoute
