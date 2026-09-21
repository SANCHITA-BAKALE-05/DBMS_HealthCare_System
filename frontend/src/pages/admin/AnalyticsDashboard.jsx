// Analytics Dashboard using Recharts + existing SQL analytics API endpoints

import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { analyticsAPI } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d']

const AnalyticsDashboard = () => {
  const [summary,    setSummary]    = useState(null)
  const [apptStats,  setApptStats]  = useState([])
  const [deptStats,  setDeptStats]  = useState([])
  const [doctorStats,setDoctorStats]= useState([])
  const [revStats,   setRevStats]   = useState([])
  const [ageGroups,  setAgeGroups]  = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsAPI.getSummary(),
      analyticsAPI.getAppointments(),
      analyticsAPI.getDepartments(),
      analyticsAPI.getDoctors(),
      analyticsAPI.getRevenue(),
      analyticsAPI.getPatients()
    ]).then(([s, a, d, doc, r, p]) => {
      setSummary(s.data.data)
      setApptStats(a.data.data)
      setDeptStats(d.data.data)
      setDoctorStats(doc.data.data)
      setRevStats(r.data.data)
      setAgeGroups(p.data.data.age_groups)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-wrap"><div className="spinner"/></div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard 📊</h1>
        <p className="page-subtitle">Healthcare system insights from existing database queries</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="stat-grid">
        {[
          ['Total Patients',     summary?.total_patients],
          ['Total Doctors',      summary?.total_doctors],
          ['Total Departments',  summary?.total_departments],
          ['Total Appointments', summary?.total_appointments],
          ['Completed',          summary?.completed_appointments],
          ['Revenue (₹)',        `₹${Number(summary?.total_revenue || 0).toFixed(0)}`],
          ['Completion Rate',    `${summary?.completion_rate_percentage || 0}%`],
        ].map(([label, val]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Appointment Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Appointment Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={apptStats} dataKey="total_appointments" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({name, value}) => `${name}: ${value}`}>
                {apptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department-wise Appointments */}
        <div className="card">
          <div className="card-title">Appointments by Department</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptStats} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_appointments" fill="#2563eb" name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doctor Load + Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">Doctor Appointment Load</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={doctorStats} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="doctor_name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_appointments" fill="#16a34a" name="Appointments"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Revenue by Payment Method</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revStats} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="payment_method" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_revenue" fill="#d97706" name="Revenue (₹)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patient Age Groups */}
      <div className="card">
        <div className="card-title">Patient Age Group Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ageGroups} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age_group" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_patients" fill="#7c3aed" name="Patients"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Doctor Ratings Table */}
      <div className="card">
        <div className="card-title">Doctor Performance Overview</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th><th>Avg Rating</th><th>Feedback Count</th></tr></thead>
            <tbody>
              {doctorStats.map(d => (
                <tr key={d.doctor_id}>
                  <td>{d.doctor_name}</td>
                  <td>{d.specialization}</td>
                  <td>{d.total_appointments}</td>
                  <td>{d.average_rating ? `${d.average_rating} ⭐` : '—'}</td>
                  <td>{d.total_feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default AnalyticsDashboard
