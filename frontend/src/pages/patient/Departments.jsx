import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { departmentAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    departmentAPI.getAll()
      .then(r => setDepartments(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Departments</h1>
        <p className="page-subtitle">Browse our medical specialties</p>
      </div>

      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {departments.map(d => (
              <div key={d.department_id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{d.department_name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>{d.description}</div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-blue">{d.total_doctors} doctor{d.total_doctors !== 1 ? 's' : ''}</span>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/patient/doctors?department_id=${d.department_id}`)}>
                    View Doctors →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </Layout>
  )
}

export default Departments
