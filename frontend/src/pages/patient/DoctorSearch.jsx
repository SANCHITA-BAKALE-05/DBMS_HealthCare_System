import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { doctorAPI, departmentAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const DoctorSearch = () => {
  const [doctors, setDoctors]         = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters]         = useState({ department_id: '', specialization: '' })
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    departmentAPI.getAll().then(r => setDepartments(r.data.data)).catch(console.error)
    fetchDoctors()
  }, [])

  const fetchDoctors = (params = {}) => {
    setLoading(true)
    doctorAPI.getAll(params)
      .then(r => setDoctors(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleFilter = e => {
    const newFilters = { ...filters, [e.target.name]: e.target.value }
    setFilters(newFilters)
    fetchDoctors(newFilters)
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Find a Doctor</h1>
        <p className="page-subtitle">Browse doctors and view their availability</p>
      </div>

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Filter by Department</label>
            <select className="form-select" name="department_id" value={filters.department_id} onChange={handleFilter}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Search Specialization</label>
            <input className="form-input" name="specialization" value={filters.specialization} onChange={handleFilter} placeholder="e.g. Cardiologist" />
          </div>
        </div>
      </div>

      {loading
        ? <div className="loading-wrap"><div className="spinner"/></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {doctors.map(d => (
              <div key={d.doctor_id} className="card" style={{ marginBottom: 0, cursor: 'pointer' }}
                onClick={() => navigate(`/patient/doctors/${d.doctor_id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. {d.first_name} {d.last_name}</div>
                    <div style={{ color: 'var(--primary)', fontSize: 13 }}>{d.specialization}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{d.department_name}</div>
                  </div>
                  <span className="badge badge-blue">{d.experience_years} yrs</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>{d.qualification}</div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>View & Book</button>
              </div>
            ))}
            {doctors.length === 0 && <p style={{ color: 'var(--muted)' }}>No doctors found.</p>}
          </div>
        )
      }
    </Layout>
  )
}

export default DoctorSearch
