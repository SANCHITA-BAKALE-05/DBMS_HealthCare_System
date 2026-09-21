import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { adminAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    adminAPI.getAppointments()
      .then(r => {
        const appts = r.data.data
        const pending   = appts.filter(a => a.status === 'PENDING').length
        const completed = appts.filter(a => a.status === 'COMPLETED').length
        setStats({ total: appts.length, pending, completed })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard 🛡️</h1>
        <p className="page-subtitle">Healthcare System Management</p>
      </div>

      {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
        <>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-label">Total Appointments</div><div className="stat-value">{stats?.total}</div></div>
            <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{stats?.pending}</div></div>
            <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.completed}</div></div>
          </div>

          <div className="card">
            <div className="card-title">Quick Navigation</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {[
                ['Analytics',     '/admin/analytics'],
                ['Patients',      '/admin/patients'],
                ['Doctors',       '/admin/doctors'],
                ['Departments',   '/admin/departments'],
                ['Appointments',  '/admin/appointments'],
                ['Payments',      '/admin/payments'],
                ['Feedback',      '/admin/feedback'],
                ['Audit Log',     '/admin/audit'],
              ].map(([label, path]) => (
                <button key={path} className="btn btn-outline" onClick={() => navigate(path)} style={{ justifyContent: 'center' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

export default AdminDashboard
