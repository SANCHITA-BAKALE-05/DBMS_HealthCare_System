// ============================================================
// AnalyticsDashboard.jsx
// Healthcare analytics with 7 real-data visualizations.
// All data fetched from the existing MySQL backend via
// the analyticsAPI service — no hardcoded chart values.
//
// Charts implemented:
//  1. Appointments by Department  (BarChart)
//  2. Appointment Status          (PieChart)
//  3. Appointment Trend           (LineChart)
//  4. Doctor Workload             (BarChart - horizontal)
//  5. Patient Age Groups          (BarChart)
//  6. Patient Gender Distribution (PieChart)
//  7. Payment Analytics           (BarChart + PieChart)
// ============================================================

import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { analyticsAPI } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

// ── Colour palette (consistent with existing --primary, --success, etc.)
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#0f766e']

// ── Small helpers ───────────────────────────────────────────

// Renders a loading/empty/error state inside a chart card
const ChartState = ({ loading, error, empty, emptyMsg }) => {
  if (loading) return (
    <div className="chart-state">
      <div className="spinner" />
      <span>Loading analytics…</span>
    </div>
  )
  if (error) return (
    <div className="chart-state chart-state--error">
      ⚠️ {error}
    </div>
  )
  if (empty) return (
    <div className="chart-state chart-state--empty">
      {emptyMsg || 'No data available.'}
    </div>
  )
  return null
}

// Wraps a chart in a consistent card
const ChartCard = ({ title, children, fullWidth }) => (
  <div className={`card chart-card${fullWidth ? ' chart-card--full' : ''}`}>
    <div className="card-title">{title}</div>
    {children}
  </div>
)

// Custom tooltip formatter for currency values
const currencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="recharts-tooltip-custom">
      <p className="recharts-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('amount')
            ? `₹${Number(p.value).toLocaleString('en-IN')}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────

const AnalyticsDashboard = () => {
  // --- state per chart so a single failure doesn't block others ---
  const [summary,       setSummary]       = useState(null)
  const [apptStats,     setApptStats]     = useState([])
  const [deptStats,     setDeptStats]     = useState([])
  const [doctorStats,   setDoctorStats]   = useState([])
  const [revStats,      setRevStats]      = useState([])
  const [ageGroups,     setAgeGroups]     = useState([])
  const [trendData,     setTrendData]     = useState([])
  const [genderData,    setGenderData]    = useState([])
  const [payStatusData, setPayStatusData] = useState([])

  // Loading flags per section
  const [loadingSummary,  setLoadingSummary]  = useState(true)
  const [loadingAppt,     setLoadingAppt]     = useState(true)
  const [loadingDept,     setLoadingDept]     = useState(true)
  const [loadingDoctors,  setLoadingDoctors]  = useState(true)
  const [loadingRev,      setLoadingRev]      = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingTrend,    setLoadingTrend]    = useState(true)
  const [loadingGender,   setLoadingGender]   = useState(true)
  const [loadingPayStat,  setLoadingPayStat]  = useState(true)

  // Error messages per section
  const [errSummary,  setErrSummary]  = useState('')
  const [errAppt,     setErrAppt]     = useState('')
  const [errDept,     setErrDept]     = useState('')
  const [errDoctors,  setErrDoctors]  = useState('')
  const [errRev,      setErrRev]      = useState('')
  const [errPatients, setErrPatients] = useState('')
  const [errTrend,    setErrTrend]    = useState('')
  const [errGender,   setErrGender]   = useState('')
  const [errPayStat,  setErrPayStat]  = useState('')

  // Fetch all analytics independently so one failure doesn't affect others
  useEffect(() => {
    analyticsAPI.getSummary()
      .then(r => setSummary(r.data.data))
      .catch(() => setErrSummary('Unable to load summary.'))
      .finally(() => setLoadingSummary(false))

    analyticsAPI.getAppointments()
      .then(r => setApptStats(r.data.data))
      .catch(() => setErrAppt('Unable to load appointment status data.'))
      .finally(() => setLoadingAppt(false))

    analyticsAPI.getDepartments()
      .then(r => setDeptStats(r.data.data))
      .catch(() => setErrDept('Unable to load department data.'))
      .finally(() => setLoadingDept(false))

    analyticsAPI.getDoctors()
      .then(r => setDoctorStats(r.data.data))
      .catch(() => setErrDoctors('Unable to load doctor data.'))
      .finally(() => setLoadingDoctors(false))

    analyticsAPI.getRevenue()
      .then(r => setRevStats(r.data.data))
      .catch(() => setErrRev('Unable to load revenue data.'))
      .finally(() => setLoadingRev(false))

    analyticsAPI.getPatients()
      .then(r => setAgeGroups(r.data.data.age_groups || []))
      .catch(() => setErrPatients('Unable to load patient data.'))
      .finally(() => setLoadingPatients(false))

    analyticsAPI.getAppointmentTrend()
      .then(r => setTrendData(r.data.data))
      .catch(() => setErrTrend('Unable to load appointment trend.'))
      .finally(() => setLoadingTrend(false))

    analyticsAPI.getGenderDistribution()
      .then(r => setGenderData(r.data.data))
      .catch(() => setErrGender('Unable to load gender distribution.'))
      .finally(() => setLoadingGender(false))

    analyticsAPI.getPaymentStatus()
      .then(r => setPayStatusData(r.data.data))
      .catch(() => setErrPayStat('Unable to load payment status data.'))
      .finally(() => setLoadingPayStat(false))
  }, [])

  // ── KPI Summary Cards ──────────────────────────────────────
  const kpis = summary ? [
    { label: 'Total Patients',     value: summary.total_patients,     color: 'var(--primary)' },
    { label: 'Total Doctors',      value: summary.total_doctors,      color: '#0891b2' },
    { label: 'Departments',        value: summary.total_departments,  color: '#7c3aed' },
    { label: 'Total Appointments', value: summary.total_appointments, color: 'var(--text)' },
    { label: 'Completed',          value: summary.completed_appointments, color: 'var(--success)' },
    { label: 'Completion Rate',    value: `${summary.completion_rate_percentage || 0}%`, color: 'var(--success)' },
    { label: 'Revenue Collected',  value: `₹${Number(summary.total_revenue || 0).toLocaleString('en-IN')}`, color: '#d97706' },
  ] : []

  // Format month labels for trend chart (2026-01 → Jan 2026)
  const formatMonth = (m) => {
    if (!m) return ''
    const [y, mo] = m.split('-')
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${monthNames[parseInt(mo, 10) - 1]} ${y}`
  }

  const trendFormatted = trendData.map(d => ({
    ...d,
    label: formatMonth(d.month)
  }))

  // Doctor workload — top 10 to keep chart readable
  const topDoctors = doctorStats.slice(0, 10)

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard 📊</h1>
        <p className="page-subtitle">Healthcare system insights — all data sourced live from the MySQL database</p>
      </div>

      {/* ── 1. KPI Summary Cards ── */}
      {loadingSummary ? (
        <div className="stat-grid">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="stat-card stat-card--skeleton" />
          ))}
        </div>
      ) : errSummary ? (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>{errSummary}</div>
      ) : (
        <div className="stat-grid">
          {kpis.map(k => (
            <div key={k.label} className="stat-card">
              <div className="stat-label">{k.label}</div>
              <div className="stat-value" style={{ color: k.color, fontSize: 22 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 1: Appointments by Department + Appointment Status ── */}
      <div className="charts-grid charts-grid--2col">

        {/* Chart 1: Appointments by Department */}
        <ChartCard title="Appointments by Department">
          <ChartState
            loading={loadingDept}
            error={errDept}
            empty={!loadingDept && !errDept && deptStats.length === 0}
            emptyMsg="No appointment data by department available."
          />
          {!loadingDept && !errDept && deptStats.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptStats} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="department_name"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Appointments', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} />
                <Tooltip
                  formatter={(v) => [v, 'Appointments']}
                  labelFormatter={(l) => `Department: ${l}`}
                />
                <Bar dataKey="total_appointments" name="Appointments" radius={[4, 4, 0, 0]}>
                  {deptStats.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 2: Appointment Status Distribution */}
        <ChartCard title="Appointment Status Distribution">
          <ChartState
            loading={loadingAppt}
            error={errAppt}
            empty={!loadingAppt && !errAppt && apptStats.length === 0}
            emptyMsg="No appointment status data available."
          />
          {!loadingAppt && !errAppt && apptStats.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={apptStats}
                  dataKey="total_appointments"
                  nameKey="status"
                  cx="50%" cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {apptStats.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Chart 3: Appointment Trend over Time (full width) ── */}
      <ChartCard title="Appointment Trend Over Time" fullWidth>
        <ChartState
          loading={loadingTrend}
          error={errTrend}
          empty={!loadingTrend && !errTrend && trendFormatted.length === 0}
          emptyMsg="No appointment trend data available yet."
        />
        {!loadingTrend && !errTrend && trendFormatted.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendFormatted} margin={{ top: 4, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Appointments', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} />
              <Tooltip formatter={(v) => [v, 'Appointments']} />
              <Line
                type="monotone"
                dataKey="total_appointments"
                name="Appointments"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Row 2: Doctor Workload + Patient Age Groups ── */}
      <div className="charts-grid charts-grid--2col">

        {/* Chart 4: Doctor Workload */}
        <ChartCard title="Doctor Appointment Workload">
          <ChartState
            loading={loadingDoctors}
            error={errDoctors}
            empty={!loadingDoctors && !errDoctors && doctorStats.length === 0}
            emptyMsg="No doctor workload data available."
          />
          {!loadingDoctors && !errDoctors && topDoctors.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                layout="vertical"
                data={topDoctors}
                margin={{ top: 4, right: 24, left: 80, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="doctor_name"
                  tick={{ fontSize: 11 }}
                  width={78}
                />
                <Tooltip formatter={(v) => [v, 'Appointments']} />
                <Bar dataKey="total_appointments" name="Appointments" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 5: Patient Age Group Distribution */}
        <ChartCard title="Patient Age Group Distribution">
          <ChartState
            loading={loadingPatients}
            error={errPatients}
            empty={!loadingPatients && !errPatients && ageGroups.length === 0}
            emptyMsg="No patient age data available."
          />
          {!loadingPatients && !errPatients && ageGroups.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageGroups} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Patients', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} />
                <Tooltip formatter={(v) => [v, 'Patients']} />
                <Bar dataKey="total_patients" name="Patients" radius={[4, 4, 0, 0]}>
                  {ageGroups.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Gender Distribution + Payment Analytics ── */}
      <div className="charts-grid charts-grid--2col">

        {/* Chart 6: Patient Gender Distribution */}
        <ChartCard title="Patient Gender Distribution">
          <ChartState
            loading={loadingGender}
            error={errGender}
            empty={!loadingGender && !errGender && genderData.length === 0}
            emptyMsg="No gender distribution data available."
          />
          {!loadingGender && !errGender && genderData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="total_patients"
                  nameKey="gender"
                  cx="50%" cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 7a: Payment Status Distribution */}
        <ChartCard title="Payment Status Overview">
          <ChartState
            loading={loadingPayStat}
            error={errPayStat}
            empty={!loadingPayStat && !errPayStat && payStatusData.length === 0}
            emptyMsg="No payment data available."
          />
          {!loadingPayStat && !errPayStat && payStatusData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={payStatusData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="payment_status" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Transactions', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `₹${Number(v).toLocaleString('en-IN', { notation: 'compact' })}`} />
                <Tooltip content={currencyTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left"  dataKey="total_transactions" name="Transactions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="total_amount"       name="Total Amount (₹)" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Revenue by Payment Method ── */}
      <ChartCard title="Revenue by Payment Method" fullWidth>
        <ChartState
          loading={loadingRev}
          error={errRev}
          empty={!loadingRev && !errRev && revStats.length === 0}
          emptyMsg="No revenue data available. Revenue is calculated from PAID transactions only."
        />
        {!loadingRev && !errRev && revStats.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revStats} margin={{ top: 4, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="payment_method" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${Number(v).toLocaleString('en-IN', { notation: 'compact' })}`} />
              <Tooltip content={currencyTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="total_revenue" name="Revenue (₹)" radius={[4, 4, 0, 0]}>
                {revStats.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
              <Bar dataKey="total_transactions" name="Transactions" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Doctor Performance Table ── */}
      <div className="card">
        <div className="card-title">Doctor Performance Overview</div>
        {loadingDoctors ? (
          <div className="chart-state"><div className="spinner"/><span>Loading…</span></div>
        ) : errDoctors ? (
          <div className="alert alert-error">{errDoctors}</div>
        ) : doctorStats.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No doctor data available.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Appointments</th>
                  <th>Avg Rating</th>
                  <th>Feedback Count</th>
                </tr>
              </thead>
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
        )}
      </div>

    </Layout>
  )
}

export default AnalyticsDashboard
