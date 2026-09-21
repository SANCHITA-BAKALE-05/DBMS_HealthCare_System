import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useParams, useNavigate } from 'react-router-dom'
import { doctorAPI, appointmentAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const DoctorDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [doctor, setDoctor]           = useState(null)
  const [slots, setSlots]             = useState([])
  const [selected, setSelected]       = useState(null)
  const [reason, setReason]           = useState('')
  const [loading, setLoading]         = useState(true)
  const [booking, setBooking]         = useState(false)
  const [msg, setMsg]                 = useState({ type: '', text: '' })

  useEffect(() => {
    Promise.all([doctorAPI.getById(id), doctorAPI.getAvailability(id)])
      .then(([dRes, sRes]) => {
        setDoctor(dRes.data.data)
        setSlots(sRes.data.data.filter(s => s.status === 'AVAILABLE'))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    if (!selected) return setMsg({ type: 'error', text: 'Please select a time slot.' })
    setBooking(true)
    try {
      await appointmentAPI.book({ availability_id: selected, reason })
      setMsg({ type: 'success', text: 'Appointment booked successfully!' })
      setSlots(slots.filter(s => s.availability_id !== selected))
      setSelected(null)
      setTimeout(() => navigate('/patient/appointments'), 2000)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Booking failed.' })
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>
  if (!doctor) return <Layout><div className="alert alert-error">Doctor not found.</div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👨‍⚕️</div>
          <div>
            <h1 className="page-title">Dr. {doctor.first_name} {doctor.last_name}</h1>
            <p className="page-subtitle">{doctor.specialization} · {doctor.department_name}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Doctor Details</div>
          <table style={{ width: '100%', fontSize: 13 }}>
            <tbody>
              <tr><td style={{ color: 'var(--muted)', paddingBottom: 8 }}>Qualification</td><td>{doctor.qualification}</td></tr>
              <tr><td style={{ color: 'var(--muted)', paddingBottom: 8 }}>Experience</td><td>{doctor.experience_years} years</td></tr>
              <tr><td style={{ color: 'var(--muted)', paddingBottom: 8 }}>Department</td><td>{doctor.department_name}</td></tr>
              <tr><td style={{ color: 'var(--muted)', paddingBottom: 8 }}>Email</td><td>{doctor.email}</td></tr>
              <tr><td style={{ color: 'var(--muted)' }}>Phone</td><td>{doctor.phone}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">Book an Appointment</div>

          {msg.text && <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>{msg.text}</div>}

          {slots.length === 0
            ? <p style={{ color: 'var(--muted)' }}>No available slots at this time.</p>
            : (
              <>
                <div className="form-group">
                  <label className="form-label">Select a Time Slot</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {slots.map(s => (
                      <div
                        key={s.availability_id}
                        onClick={() => setSelected(s.availability_id)}
                        style={{
                          padding: '10px 12px', border: `2px solid ${selected === s.availability_id ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12,
                          background: selected === s.availability_id ? '#eff6ff' : '#fff'
                        }}
                      >
                        <strong>{s.available_date?.slice(0,10)}</strong><br/>
                        {s.start_time} – {s.end_time}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Visit</label>
                  <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly describe your concern..." />
                </div>
                <button className="btn btn-primary" onClick={handleBook} disabled={booking}>
                  {booking ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </>
            )
          }
        </div>
      </div>
    </Layout>
  )
}

export default DoctorDetail
