import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { patientAPI } from '../../services/api'

const PatientProfile = () => {
  const [profile, setProfile] = useState(null)
  const [form, setForm]       = useState({ phone: '', address: '', blood_group: '' })
  const [editing, setEditing] = useState(false)
  const [msg, setMsg]         = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientAPI.getProfile()
      .then(r => {
        setProfile(r.data.data)
        setForm({ phone: r.data.data.phone || '', address: r.data.data.address || '', blood_group: r.data.data.blood_group || '' })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async e => {
    e.preventDefault()
    try {
      await patientAPI.updateProfile(form)
      setMsg({ type: 'success', text: 'Profile updated successfully.' })
      setEditing(false)
      patientAPI.getProfile().then(r => setProfile(r.data.data))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' })
    }
  }

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            ['Name',         `${profile?.first_name} ${profile?.last_name}`],
            ['Date of Birth',profile?.date_of_birth?.slice(0,10)],
            ['Age',          `${profile?.age} years`],
            ['Gender',       profile?.gender],
            ['Email',        profile?.email],
            ['Patient ID',   profile?.patient_id],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        {editing ? (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select className="form-select" value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                ['Phone',       profile?.phone],
                ['Blood Group', profile?.blood_group],
                ['Address',     profile?.address],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: 2 }}>{val || '—'}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </Layout>
  )
}

export default PatientProfile
