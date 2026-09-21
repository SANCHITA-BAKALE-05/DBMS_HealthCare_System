import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { adminAPI, departmentAPI } from '../../services/api'

const ManageDoctors = () => {
  const [doctors, setDoctors]         = useState([])
  const [departments, setDepartments] = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ username:'', password:'', first_name:'', last_name:'', specialization:'', department_id:'', qualification:'', experience_years:'', phone:'', email:'' })
  const [msg, setMsg]                 = useState({ type:'', text:'' })
  const [loading, setLoading]         = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([adminAPI.getDoctors(), departmentAPI.getAll()])
      .then(([dRes, depRes]) => { setDoctors(dRes.data.data); setDepartments(depRes.data.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async e => {
    e.preventDefault()
    try {
      await adminAPI.createDoctor(form)
      setMsg({ type:'success', text:'Doctor account created.' })
      setShowForm(false)
      setForm({ username:'', password:'', first_name:'', last_name:'', specialization:'', department_id:'', qualification:'', experience_years:'', phone:'', email:'' })
      load()
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Failed to create doctor.' })
    }
  }

  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <Layout>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 className="page-title">Manage Doctors</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Doctor'}</button>
      </div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showForm && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-title">New Doctor Account</div>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" name="first_name" value={form.first_name} onChange={f} required /></div>
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" name="last_name" value={form.last_name} onChange={f} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Username *</label><input className="form-input" name="username" value={form.username} onChange={f} required /></div>
              <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" name="password" value={form.password} onChange={f} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Specialization *</label><input className="form-input" name="specialization" value={form.specialization} onChange={f} required /></div>
              <div className="form-group"><label className="form-label">Department *</label>
                <select className="form-select" name="department_id" value={form.department_id} onChange={f} required>
                  <option value="">Select</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Qualification</label><input className="form-input" name="qualification" value={form.qualification} onChange={f} /></div>
              <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-input" type="number" name="experience_years" value={form.experience_years} onChange={f} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" name="phone" value={form.phone} onChange={f} required /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" name="email" value={form.email} onChange={f} required /></div>
            </div>
            <button className="btn btn-primary">Create Doctor</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Specialization</th><th>Department</th><th>Experience</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {doctors.map(d => (
                  <tr key={d.doctor_id}>
                    <td>{d.doctor_id}</td>
                    <td>Dr. {d.first_name} {d.last_name}</td>
                    <td>{d.specialization}</td>
                    <td>{d.department_name}</td>
                    <td>{d.experience_years} yrs</td>
                    <td>{d.email}</td>
                    <td><span className={`badge ${d.account_status==='ACTIVE'?'badge-green':'badge-red'}`}>{d.account_status}</span></td>
                  </tr>
                ))}
                {doctors.length === 0 && <tr><td colSpan={7} style={{ color:'var(--muted)', textAlign:'center' }}>No doctors.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ManageDoctors
