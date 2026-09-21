import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { doctorAPI } from '../../services/api'

const ManageAvailability = () => {
  const [slots, setSlots]   = useState([])
  const [form, setForm]     = useState({ available_date: '', start_time: '', end_time: '' })
  const [msg, setMsg]       = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    doctorAPI.getMyAvailability()
      .then(r => setSlots(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async e => {
    e.preventDefault()
    try {
      await doctorAPI.addSlot(form)
      setMsg({ type: 'success', text: 'Slot added.' })
      setForm({ available_date: '', start_time: '', end_time: '' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add slot.' })
    }
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this slot?')) return
    try {
      await doctorAPI.removeSlot(id)
      setMsg({ type: 'success', text: 'Slot removed.' })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to remove.' })
    }
  }

  const statusBadge = s => {
    const map = { AVAILABLE:'badge-green', BOOKED:'badge-blue', BLOCKED:'badge-red' }
    return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>
  }

  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">My Availability</h1></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-title">Add New Slot</div>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.available_date} onChange={e => setForm({...form, available_date: e.target.value})} required min={new Date().toISOString().slice(0,10)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
            </div>
          </div>
          <button className="btn btn-primary">Add Slot</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Slots</div>
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.availability_id}>
                    <td>{s.available_date?.slice(0,10)}</td>
                    <td>{s.start_time}</td>
                    <td>{s.end_time}</td>
                    <td>{statusBadge(s.status)}</td>
                    <td>
                      {s.status === 'AVAILABLE' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s.availability_id)}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
                {slots.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center' }}>No slots.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ManageAvailability
