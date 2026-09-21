import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { adminAPI } from '../../services/api'

const ManagePatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState({ type:'', text:'' })

  const load = () => {
    setLoading(true)
    adminAPI.getPatients()
      .then(r => setPatients(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updatePatientStatus(id, { account_status: status })
      setMsg({ type: 'success', text: `Patient status updated to ${status}.` })
      load()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' })
    }
  }

  const statusBadge = s => {
    const map = { ACTIVE:'badge-green', INACTIVE:'badge-yellow', BLOCKED:'badge-red' }
    return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>
  }

  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">Manage Patients</h1></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      <div className="card">
        {loading ? <div className="loading-wrap"><div className="spinner"/></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Blood Group</th><th>Age</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.patient_id}>
                    <td>{p.patient_id}</td>
                    <td>{p.first_name} {p.last_name}</td>
                    <td>{p.email}</td>
                    <td>{p.phone}</td>
                    <td>{p.blood_group || '—'}</td>
                    <td>{p.age}</td>
                    <td>{statusBadge(p.account_status)}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      {p.account_status !== 'ACTIVE'   && <button className="btn btn-success btn-sm" onClick={() => updateStatus(p.patient_id, 'ACTIVE')}>Activate</button>}
                      {p.account_status !== 'BLOCKED'  && <button className="btn btn-danger btn-sm"  onClick={() => updateStatus(p.patient_id, 'BLOCKED')}>Block</button>}
                    </td>
                  </tr>
                ))}
                {patients.length === 0 && <tr><td colSpan={8} style={{ color:'var(--muted)', textAlign:'center' }}>No patients.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ManagePatients
