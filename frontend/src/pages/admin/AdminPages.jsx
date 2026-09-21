// Simple reusable admin list page factory for tables that are view-only

import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { adminAPI, departmentAPI } from '../../services/api'

const StatusBadge = ({ status }) => {
  const map = { PENDING:'badge-yellow', CONFIRMED:'badge-blue', COMPLETED:'badge-green', CANCELLED:'badge-red' }
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>
}

// ---- Admin Appointments ----
export const AdminAppointments = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getAppointments().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [])
  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">All Appointments</h1></div>
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {data.map(a => <tr key={a.appointment_id}>
                  <td>{a.appointment_id}</td>
                  <td>{a.available_date?.slice(0,10)}</td>
                  <td>{a.start_time}</td>
                  <td>{a.patient_name}</td>
                  <td>Dr. {a.doctor_name}</td>
                  <td>{a.department_name}</td>
                  <td>{a.reason||'—'}</td>
                  <td><StatusBadge status={a.status}/></td>
                </tr>)}
                {data.length === 0 && <tr><td colSpan={8} style={{color:'var(--muted)',textAlign:'center'}}>No data.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ---- Admin Payments ----
export const AdminPayments = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const total = data.filter(p => p.payment_status === 'PAID').reduce((s, p) => s + Number(p.amount), 0)
  useEffect(() => { adminAPI.getPayments().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [])
  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Payments</h1></div>
      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 360 }}>
        <div className="stat-card"><div className="stat-label">Total Paid</div><div className="stat-value">₹{total.toFixed(0)}</div></div>
        <div className="stat-card"><div className="stat-label">Transactions</div><div className="stat-value">{data.length}</div></div>
      </div>
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Amount</th><th>Method</th><th>Status</th><th>Ref</th></tr></thead>
              <tbody>
                {data.map(p => <tr key={p.payment_id}>
                  <td>{p.payment_id}</td>
                  <td>{p.payment_date?.slice(0,10)}</td>
                  <td>{p.patient_name}</td>
                  <td>Dr. {p.doctor_name}</td>
                  <td>₹{Number(p.amount).toFixed(2)}</td>
                  <td>{p.payment_method}</td>
                  <td><span className={`badge ${p.payment_status==='PAID'?'badge-green':'badge-yellow'}`}>{p.payment_status}</span></td>
                  <td>{p.transaction_reference||'—'}</td>
                </tr>)}
                {data.length === 0 && <tr><td colSpan={8} style={{color:'var(--muted)',textAlign:'center'}}>No data.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ---- Admin Feedback ----
export const AdminFeedback = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getFeedback().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [])
  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Patient Feedback</h1></div>
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Rating</th><th>Comments</th></tr></thead>
              <tbody>
                {data.map(f => <tr key={f.feedback_id}>
                  <td>{f.feedback_id}</td>
                  <td>{f.created_at?.slice(0,10)}</td>
                  <td>{f.patient_name}</td>
                  <td>Dr. {f.doctor_name}</td>
                  <td>{'⭐'.repeat(f.rating)}</td>
                  <td>{f.comments||'—'}</td>
                </tr>)}
                {data.length === 0 && <tr><td colSpan={6} style={{color:'var(--muted)',textAlign:'center'}}>No feedback yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ---- Admin Audit Log ----
export const AdminAudit = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getAudit().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)) }, [])
  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Appointment Audit Log</h1><p className="page-subtitle">Automatically recorded by database trigger</p></div>
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Audit ID</th><th>Appointment</th><th>Patient</th><th>Old Status</th><th>New Status</th><th>Changed At</th><th>Changed By</th><th>Remarks</th></tr></thead>
              <tbody>
                {data.map(a => <tr key={a.audit_id}>
                  <td>{a.audit_id}</td>
                  <td>{a.appointment_id}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.old_status ? <StatusBadge status={a.old_status}/> : '—'}</td>
                  <td><StatusBadge status={a.new_status}/></td>
                  <td>{a.changed_at?.slice(0,19).replace('T',' ')}</td>
                  <td>{a.changed_by||'—'}</td>
                  <td>{a.remarks||'—'}</td>
                </tr>)}
                {data.length === 0 && <tr><td colSpan={8} style={{color:'var(--muted)',textAlign:'center'}}>No audit records.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

// ---- Admin Departments ----
export const AdminDepartments = () => {
  const [data, setData]   = useState([])
  const [form, setForm]   = useState({ department_name:'', description:'' })
  const [msg, setMsg]     = useState({ type:'', text:'' })
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); departmentAPI.getAll().then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleCreate = async e => {
    e.preventDefault()
    try {
      await departmentAPI.create(form)
      setMsg({ type:'success', text:'Department created.' })
      setForm({ department_name:'', description:'' })
      load()
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Failed.' })
    }
  }

  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Departments</h1></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-title">Add Department</div>
        <form onSubmit={handleCreate}>
          <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.department_name} onChange={e => setForm({...form, department_name: e.target.value})} required /></div>
          <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <button className="btn btn-primary">Add</button>
        </form>
      </div>
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Doctors</th></tr></thead>
              <tbody>
                {data.map(d => <tr key={d.department_id}>
                  <td>{d.department_id}</td>
                  <td>{d.department_name}</td>
                  <td>{d.description||'—'}</td>
                  <td>{d.total_doctors}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
