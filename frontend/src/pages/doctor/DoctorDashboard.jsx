import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { appointmentAPI, doctorAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const StatusBadge = ({ status }) => {
  const map = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', COMPLETED:'badge-green', CANCELLED:'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

const DoctorDashboard = () => {
  const [profile, setProfile]     = useState(null)
  const [appointments, setAppts]  = useState([])
  const [loading, setLoading]     = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([doctorAPI.getProfile(), appointmentAPI.getDoctorList()])
      .then(([pRes, aRes]) => {
        setProfile(pRes.data.data)
        setAppts(aRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>

  const today = appointments.filter(a => a.available_date?.slice(0,10) === new Date().toISOString().slice(0,10))
  const pending = appointments.filter(a => a.status === 'PENDING')

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Welcome, Dr. {profile?.first_name} 👨‍⚕️</h1>
        <p className="page-subtitle">{profile?.specialization} · {profile?.department_name}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Appointments</div><div className="stat-value">{appointments.length}</div></div>
        <div className="stat-card"><div className="stat-label">Today's Appointments</div><div className="stat-value" style={{ color: 'var(--primary)' }}>{today.length}</div></div>
        <div className="stat-card"><div className="stat-label">Pending Review</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{pending.length}</div></div>
        <div className="stat-card"><div className="stat-label">Experience</div><div className="stat-value" style={{ fontSize: 22 }}>{profile?.experience_years} yrs</div></div>
      </div>

      <div className="card">
        <div className="card-title">Recent Appointments</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {appointments.slice(0,10).map(a => (
                <tr key={a.appointment_id}>
                  <td>{a.available_date?.slice(0,10)}</td>
                  <td>{a.start_time}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.reason || '—'}</td>
                  <td><StatusBadge status={a.status}/></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigate('/doctor/appointments')}>Manage</button>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)', textAlign: 'center' }}>No appointments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default DoctorDashboard
