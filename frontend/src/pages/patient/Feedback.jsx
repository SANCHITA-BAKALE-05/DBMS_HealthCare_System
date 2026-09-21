import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { feedbackAPI, appointmentAPI } from '../../services/api'

const Feedback = () => {
  const [appointments, setAppts]  = useState([])
  const [myFeedback, setFeedback] = useState([])
  const [form, setForm]           = useState({ appointment_id: '', rating: 5, comments: '' })
  const [msg, setMsg]             = useState({ type: '', text: '' })
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([appointmentAPI.getMyList(), feedbackAPI.getMine()])
      .then(([aRes, fRes]) => {
        // Only completed appointments that don't already have feedback
        const feedbackApptIds = new Set(fRes.data.data.map(f => f.appointment_id))
        setAppts(aRes.data.data.filter(a => a.status === 'COMPLETED' && !feedbackApptIds.has(a.appointment_id)))
        setFeedback(fRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await feedbackAPI.submit(form)
      setMsg({ type: 'success', text: 'Thank you for your feedback!' })
      setForm({ appointment_id: '', rating: 5, comments: '' })
      // Refresh
      feedbackAPI.getMine().then(r => setFeedback(r.data.data))
      setAppts(appts => appts.filter(a => a.appointment_id !== form.appointment_id))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed.' })
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
      </div>

      {appointments.length > 0 && (
        <div className="card">
          <div className="card-title">Submit Feedback</div>
          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Appointment</label>
              <select className="form-select" value={form.appointment_id} onChange={e => setForm({...form, appointment_id: e.target.value})} required>
                <option value="">Select appointment</option>
                {appointments.map(a => (
                  <option key={a.appointment_id} value={a.appointment_id}>
                    {a.available_date?.slice(0,10)} – Dr. {a.doctor_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rating (1–5)</label>
              <select className="form-select" value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comments</label>
              <textarea className="form-input" rows={3} value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} style={{ resize: 'vertical' }}/>
            </div>
            <button className="btn btn-primary">Submit Feedback</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-title">My Feedback History</div>
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> :
         myFeedback.length === 0 ? <p style={{ color: 'var(--muted)' }}>No feedback submitted yet.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Doctor</th><th>Rating</th><th>Comments</th></tr></thead>
              <tbody>
                {myFeedback.map(f => (
                  <tr key={f.feedback_id}>
                    <td>{f.available_date?.slice(0,10)}</td>
                    <td>Dr. {f.doctor_name}</td>
                    <td>{'⭐'.repeat(f.rating)}</td>
                    <td>{f.comments || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Feedback
