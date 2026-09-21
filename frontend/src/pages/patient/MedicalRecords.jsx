import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { medicalRecordAPI } from '../../services/api'

const MedicalRecords = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medicalRecordAPI.getMine()
      .then(r => setRecords(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Medical Records</h1>
        <p className="page-subtitle">Your complete health history</p>
      </div>

      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : records.length === 0
          ? <div className="card"><p style={{ color: 'var(--muted)' }}>No medical records found.</p></div>
          : records.map(r => (
            <div key={r.record_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <strong>Dr. {r.doctor_name}</strong> · {r.specialization}
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.available_date?.slice(0,10)}</span>
              </div>
              <div className="form-row">
                <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>Symptoms</span><br/>{r.symptoms || '—'}</div>
                <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>Diagnosis</span><br/>{r.diagnosis || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                {[
                  ['Blood Pressure', r.blood_pressure],
                  ['Blood Sugar',    r.blood_sugar ? `${r.blood_sugar} mg/dL` : null],
                  ['Heart Rate',     r.heart_rate  ? `${r.heart_rate} bpm`   : null],
                  ['Weight',         r.weight      ? `${r.weight} kg`        : null],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
                    <div style={{ fontWeight: 700, marginTop: 2 }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
              {r.doctor_notes && (
                <div style={{ marginTop: 12, background: '#eff6ff', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>
                  <strong>Doctor Notes:</strong> {r.doctor_notes}
                </div>
              )}
            </div>
          ))
      }
    </Layout>
  )
}

export default MedicalRecords
