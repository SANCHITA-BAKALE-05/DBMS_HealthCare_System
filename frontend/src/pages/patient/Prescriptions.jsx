import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { prescriptionAPI } from '../../services/api'

const Prescriptions = () => {
  const [prescriptions, setPresc] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    prescriptionAPI.getMine()
      .then(r => setPresc(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Prescriptions</h1>
      </div>

      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : prescriptions.length === 0
          ? <div className="card"><p style={{ color: 'var(--muted)' }}>No prescriptions found.</p></div>
          : prescriptions.map(p => (
            <div key={p.prescription_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <strong>Dr. {p.doctor_name}</strong> · {p.prescription_date}
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Diagnosis: {p.diagnosis || '—'}</span>
              </div>
              {p.instructions && (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  <strong>Instructions:</strong> {p.instructions}
                </div>
              )}
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Notes</th></tr></thead>
                  <tbody>
                    {p.items?.map(item => (
                      <tr key={item.prescription_item_id}>
                        <td><strong>{item.medicine_name}</strong></td>
                        <td>{item.dosage || '—'}</td>
                        <td>{item.frequency || '—'}</td>
                        <td>{item.duration || '—'}</td>
                        <td>{item.instructions || '—'}</td>
                      </tr>
                    ))}
                    {!p.items?.length && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>No items.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ))
      }
    </Layout>
  )
}

export default Prescriptions
