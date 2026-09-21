import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { appointmentAPI, patientAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const PatientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile]     = useState(null)
  const [appointments, setAppts]  = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([patientAPI.getProfile(), appointmentAPI.getMyList()])
      .then(([pRes, aRes]) => {
        setProfile(pRes.data.data)
        setAppts(aRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>

  const upcoming = appointments.filter(a => ['PENDING','CONFIRMED'].includes(a.status))
  const completed = appointments.filter(a => a.status === 'COMPLETED')

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Welcome, {profile?.first_name} 👋</h1>
        <p className="page-subtitle">Your health dashboard</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Appointments</div>
          <div className="stat-value">{appointments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Upcoming</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{upcoming.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{completed.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blood Group</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{profile?.blood_group || '—'}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Upcoming Appointments</div>
        {upcoming.length === 0
          ? <p style={{ color: 'var(--muted)' }}>No upcoming appointments. <span style={{ cursor:'pointer', color: 'var(--primary)' }} onClick={() => navigate('/patient/doctors')}>Book one now →</span></p>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Time</th><th>Doctor</th><th>Department</th><th>Status</th></tr></thead>
                <tbody>
                  {upcoming.map(a => (
                    <tr key={a.appointment_id}>
                      <td>{a.available_date?.slice(0,10)}</td>
                      <td>{a.start_time} – {a.end_time}</td>
                      <td>Dr. {a.doctor_name}</td>
                      <td>{a.department_name}</td>
                      <td><StatusBadge status={a.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      <div className="card">
        <div className="card-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/patient/doctors')}>Find a Doctor</button>
          <button className="btn btn-outline" onClick={() => navigate('/patient/appointments')}>View All Appointments</button>
          <button className="btn btn-outline" onClick={() => navigate('/patient/records')}>Medical Records</button>
          <button className="btn btn-outline" onClick={() => navigate('/patient/ml')}>Health Risk Check</button>
        </div>
      </div>
    </Layout>
  )
}

const StatusBadge = ({ status }) => {
  const map = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', COMPLETED:'badge-green', CANCELLED:'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

export default PatientDashboard
