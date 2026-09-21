import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { appointmentAPI } from '../../services/api'

const StatusBadge = ({ status }) => {
  const map = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', COMPLETED:'badge-green', CANCELLED:'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

const MyAppointments = () => {
  const [appointments, setAppts] = useState([])
  const [loading, setLoading]    = useState(true)
  const [msg, setMsg]            = useState({ type: '', text: '' })

  const load = () => {
    setLoading(true)
    appointmentAPI.getMyList()
      .then(r => setAppts(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await appointmentAPI.cancel(id)
      setMsg({ type: 'success', text: 'Appointment cancelled.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to cancel.' })
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Appointments</h1>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        {loading
          ? <div className="loading-wrap"><div className="spinner"/></div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Time</th><th>Doctor</th><th>Dept</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {appointments.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center' }}>No appointments found.</td></tr>}
                  {appointments.map(a => (
                    <tr key={a.appointment_id}>
                      <td>{a.available_date?.slice(0,10)}</td>
                      <td>{a.start_time}</td>
                      <td>Dr. {a.doctor_name}</td>
                      <td>{a.department_name}</td>
                      <td>{a.reason || '—'}</td>
                      <td><StatusBadge status={a.status}/></td>
                      <td>
                        {['PENDING','CONFIRMED'].includes(a.status) && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(a.appointment_id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </Layout>
  )
}

export default MyAppointments
