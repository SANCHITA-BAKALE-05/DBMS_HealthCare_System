import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { doctorAPI } from '../../services/api'

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    doctorAPI.getProfile()
      .then(r => setProfile(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>

  return (
    <Layout>
      <div className="page-header"><h1 className="page-title">My Profile</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>👨‍⚕️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Dr. {profile?.first_name} {profile?.last_name}</div>
            <div style={{ color: 'var(--primary)', marginTop: 2 }}>{profile?.specialization}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{profile?.department_name}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
          {[
            ['Doctor ID',        profile?.doctor_id],
            ['Qualification',    profile?.qualification],
            ['Experience',       `${profile?.experience_years} years`],
            ['Email',            profile?.email],
            ['Phone',            profile?.phone],
            ['Department',       profile?.department_name],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default DoctorProfile
