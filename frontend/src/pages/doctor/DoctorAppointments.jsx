import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { appointmentAPI, medicalRecordAPI, prescriptionAPI } from '../../services/api'

const StatusBadge = ({ status }) => {
  const map = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', COMPLETED:'badge-green', CANCELLED:'badge-red' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

const DoctorAppointments = () => {
  const [appointments, setAppts]     = useState([])
  const [selected, setSelected]      = useState(null)
  const [loading, setLoading]        = useState(true)
  const [updating, setUpdating]      = useState(false)
  const [msg, setMsg]                = useState({ type: '', text: '' })
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordForm, setRecordForm]  = useState({ symptoms:'', diagnosis:'', blood_pressure:'', blood_sugar:'', heart_rate:'', weight:'', doctor_notes:'' })

  const load = () => {
    setLoading(true)
    appointmentAPI.getDoctorList()
      .then(r => setAppts(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    setUpdating(true)
    try {
      await appointmentAPI.updateStatus(id, status)
      setMsg({ type: 'success', text: `Status updated to ${status}.` })
      load()
      setSelected(null)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update.' })
    } finally { setUpdating(false) }
  }

  const submitRecord = async e => {
    e.preventDefault()
    try {
      await medicalRecordAPI.create({ appointment_id: selected.appointment_id, ...recordForm })
      setMsg({ type: 'success', text: 'Medical record saved.' })
      setShowRecordForm(false)
      setRecordForm({ symptoms:'', diagnosis:'', blood_pressure:'', blood_sugar:'', heart_rate:'', weight:'', doctor_notes:'' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save record.' })
    }
  }

  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Appointments</h1></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div className="card">
          {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.appointment_id} style={{ cursor: 'pointer', background: selected?.appointment_id === a.appointment_id ? '#eff6ff' : '' }}
                      onClick={() => { setSelected(a); setShowRecordForm(false) }}>
                      <td>{a.available_date?.slice(0,10)}</td>
                      <td>{a.start_time}</td>
                      <td>{a.patient_name}</td>
                      <td>{a.reason || '—'}</td>
                      <td><StatusBadge status={a.status}/></td>
                    </tr>
                  ))}
                  {appointments.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center' }}>No appointments.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="card">
            <div className="card-title">Appointment Details</div>
            <p><strong>Patient:</strong> {selected.patient_name}</p>
            <p><strong>Phone:</strong> {selected.patient_phone}</p>
            <p><strong>Date:</strong> {selected.available_date?.slice(0,10)} {selected.start_time}</p>
            <p><strong>Reason:</strong> {selected.reason || '—'}</p>
            <p><strong>Status:</strong> <StatusBadge status={selected.status}/></p>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {selected.status === 'PENDING' && (
                <button className="btn btn-success btn-sm" disabled={updating} onClick={() => updateStatus(selected.appointment_id, 'CONFIRMED')}>Confirm</button>
              )}
              {['PENDING','CONFIRMED'].includes(selected.status) && (
                <button className="btn btn-primary btn-sm" disabled={updating} onClick={() => updateStatus(selected.appointment_id, 'COMPLETED')}>Mark Completed</button>
              )}
              {['PENDING','CONFIRMED'].includes(selected.status) && (
                <button className="btn btn-danger btn-sm" disabled={updating} onClick={() => updateStatus(selected.appointment_id, 'CANCELLED')}>Cancel</button>
              )}
              {['CONFIRMED','COMPLETED'].includes(selected.status) && (
                <button className="btn btn-outline btn-sm" onClick={() => setShowRecordForm(!showRecordForm)}>
                  {showRecordForm ? 'Hide Record Form' : 'Add Medical Record'}
                </button>
              )}
            </div>

            {showRecordForm && (
              <form onSubmit={submitRecord} style={{ marginTop: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Medical Record</div>
                {['symptoms','diagnosis','blood_pressure','doctor_notes'].map(field => (
                  <div className="form-group" key={field}>
                    <label className="form-label">{field.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                    <input className="form-input" value={recordForm[field]} onChange={e => setRecordForm({...recordForm, [field]: e.target.value})} />
                  </div>
                ))}
                <div className="form-row">
                  {['blood_sugar','heart_rate','weight'].map(field => (
                    <div className="form-group" key={field}>
                      <label className="form-label">{field.replace('_',' ')}</label>
                      <input className="form-input" type="number" step="0.01" value={recordForm[field]} onChange={e => setRecordForm({...recordForm, [field]: e.target.value})} />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm">Save Record</button>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DoctorAppointments
