// ============================================================
// MLPrediction.jsx
// Health Risk Estimation page for patients.
// Connects to all 4 ML models via the Node.js backend proxy.
//
// IMPORTANT: All results are clearly labeled as MODEL ESTIMATES
// and NOT medical diagnoses.
// ============================================================

import React, { useState } from 'react'
import Layout from '../../components/Layout'
import { mlAPI } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts'

const DISCLAIMER = `This result is an estimate from a machine-learning model and is NOT a medical diagnosis or professional medical advice. 
Please consult a qualified healthcare professional before making any health decisions.`

// ---- Sub-forms for each model ----

const DiabetesForm = ({ onResult }) => {
  const [form, setForm] = useState({ Age: '', Sex: '1', BMI: '', HighBP: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const res = await mlAPI.diabetes({ Age: Number(form.Age), Sex: Number(form.Sex), BMI: Number(form.BMI), HighBP: Number(form.HighBP) })
      onResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Age</label>
          <input className="form-input" name="Age" type="number" value={form.Age} onChange={f} required min={1} max={120} />
        </div>
        <div className="form-group">
          <label className="form-label">Sex</label>
          <select className="form-select" name="Sex" value={form.Sex} onChange={f}>
            <option value="0">Female (0)</option>
            <option value="1">Male (1)</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">BMI</label>
          <input className="form-input" name="BMI" type="number" step="0.1" value={form.BMI} onChange={f} required />
        </div>
        <div className="form-group">
          <label className="form-label">High Blood Pressure?</label>
          <select className="form-select" name="HighBP" value={form.HighBP} onChange={f}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Estimating...' : 'Estimate Risk'}</button>
    </form>
  )
}

const HypertensionForm = ({ onResult }) => {
  const [form, setForm] = useState({ male:'1', age:'', currentSmoker:'0', cigsPerDay:'0', BPMeds:'0', diabetes:'0', totChol:'', sysBP:'', diaBP:'', BMI:'', heartRate:'', glucose:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k,v]) => [k, Number(v)]))
      const res = await mlAPI.hypertension(payload)
      onResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Sex</label>
          <select className="form-select" name="male" value={form.male} onChange={f}>
            <option value="0">Female</option><option value="1">Male</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Age</label>
          <input className="form-input" name="age" type="number" value={form.age} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Current Smoker?</label>
          <select className="form-select" name="currentSmoker" value={form.currentSmoker} onChange={f}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Cigarettes/Day</label>
          <input className="form-input" name="cigsPerDay" type="number" value={form.cigsPerDay} onChange={f} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">On BP Medication?</label>
          <select className="form-select" name="BPMeds" value={form.BPMeds} onChange={f}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Diabetes?</label>
          <select className="form-select" name="diabetes" value={form.diabetes} onChange={f}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Total Cholesterol</label>
          <input className="form-input" name="totChol" type="number" value={form.totChol} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">BMI</label>
          <input className="form-input" name="BMI" type="number" step="0.1" value={form.BMI} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Systolic BP</label>
          <input className="form-input" name="sysBP" type="number" step="0.1" value={form.sysBP} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Diastolic BP</label>
          <input className="form-input" name="diaBP" type="number" step="0.1" value={form.diaBP} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Heart Rate</label>
          <input className="form-input" name="heartRate" type="number" value={form.heartRate} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Glucose</label>
          <input className="form-input" name="glucose" type="number" step="0.1" value={form.glucose} onChange={f} required />
        </div>
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Estimating...' : 'Estimate Risk'}</button>
    </form>
  )
}

const CardioForm = ({ onResult }) => {
  const [form, setForm] = useState({ age:'', sex:'1', cp:'1', trestbps:'', chol:'', fbs:'0', restecg:'0', thalach:'', exang:'0', oldpeak:'', slope:'1', ca:'0', thal:'3' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k,v]) => [k, Number(v)]))
      const res = await mlAPI.cardiovascular(payload)
      onResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Age</label>
          <input className="form-input" name="age" type="number" value={form.age} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Sex</label>
          <select className="form-select" name="sex" value={form.sex} onChange={f}>
            <option value="0">Female</option><option value="1">Male</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Chest Pain Type (cp 0–3)</label>
          <input className="form-input" name="cp" type="number" value={form.cp} min={0} max={3} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Resting BP (trestbps)</label>
          <input className="form-input" name="trestbps" type="number" value={form.trestbps} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Cholesterol (chol)</label>
          <input className="form-input" name="chol" type="number" value={form.chol} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Max Heart Rate (thalach)</label>
          <input className="form-input" name="thalach" type="number" value={form.thalach} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Exercise Angina (exang)</label>
          <select className="form-select" name="exang" value={form.exang} onChange={f}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">ST Depression (oldpeak)</label>
          <input className="form-input" name="oldpeak" type="number" step="0.1" value={form.oldpeak} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Fasting Blood Sugar &gt;120?</label>
          <select className="form-select" name="fbs" value={form.fbs} onChange={f}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Resting ECG (0–2)</label>
          <input className="form-input" name="restecg" type="number" min={0} max={2} value={form.restecg} onChange={f} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Slope (1–3)</label>
          <input className="form-input" name="slope" type="number" min={1} max={3} value={form.slope} onChange={f} />
        </div>
        <div className="form-group"><label className="form-label">Vessels Colored (ca 0–3)</label>
          <input className="form-input" name="ca" type="number" min={0} max={3} value={form.ca} onChange={f} />
        </div>
      </div>
      <div className="form-group"><label className="form-label">Thal (3=normal, 6=fixed, 7=reversable)</label>
        <select className="form-select" name="thal" value={form.thal} onChange={f}>
          <option value="3">3 – Normal</option>
          <option value="6">6 – Fixed Defect</option>
          <option value="7">7 – Reversable Defect</option>
        </select>
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Estimating...' : 'Estimate Risk'}</button>
    </form>
  )
}

const ObesityForm = ({ onResult }) => {
  const [form, setForm] = useState({
    Age:'', Height:'', Weight:'', FCVC:'2', NCP:'3', CH2O:'2', FAF:'0', TUE:'0',
    Gender:'Male', family_history_with_overweight:'yes', FAVC:'yes',
    CAEC:'Sometimes', SMOKE:'no', SCC:'no', CALC:'no', MTRANS:'Public_Transportation'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const f = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const numFields = ['Age','Height','Weight','FCVC','NCP','CH2O','FAF','TUE']
      const payload = { ...form }
      numFields.forEach(k => { payload[k] = Number(payload[k]) })
      const res = await mlAPI.obesity(payload)
      onResult(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Gender</label>
          <select className="form-select" name="Gender" value={form.Gender} onChange={f}>
            <option>Male</option><option>Female</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Age</label>
          <input className="form-input" name="Age" type="number" value={form.Age} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Height (m)</label>
          <input className="form-input" name="Height" type="number" step="0.01" value={form.Height} onChange={f} required />
        </div>
        <div className="form-group"><label className="form-label">Weight (kg)</label>
          <input className="form-input" name="Weight" type="number" step="0.1" value={form.Weight} onChange={f} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Family history overweight?</label>
          <select className="form-select" name="family_history_with_overweight" value={form.family_history_with_overweight} onChange={f}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Frequent high caloric food? (FAVC)</label>
          <select className="form-select" name="FAVC" value={form.FAVC} onChange={f}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Veg frequency 1–3 (FCVC)</label>
          <input className="form-input" name="FCVC" type="number" min="1" max="3" step="1" value={form.FCVC} onChange={f} />
        </div>
        <div className="form-group"><label className="form-label">Meals/day (NCP)</label>
          <input className="form-input" name="NCP" type="number" min="1" max="4" value={form.NCP} onChange={f} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Water daily liters (CH2O)</label>
          <input className="form-input" name="CH2O" type="number" min="1" max="3" value={form.CH2O} onChange={f} />
        </div>
        <div className="form-group"><label className="form-label">Physical activity freq (FAF 0–3)</label>
          <input className="form-input" name="FAF" type="number" min="0" max="3" value={form.FAF} onChange={f} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Tech screen time hrs (TUE 0–2)</label>
          <input className="form-input" name="TUE" type="number" min="0" max="2" value={form.TUE} onChange={f} />
        </div>
        <div className="form-group"><label className="form-label">Eat between meals (CAEC)</label>
          <select className="form-select" name="CAEC" value={form.CAEC} onChange={f}>
            <option>no</option><option>Sometimes</option><option>Frequently</option><option>Always</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Smoke?</label>
          <select className="form-select" name="SMOKE" value={form.SMOKE} onChange={f}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Monitor calories? (SCC)</label>
          <select className="form-select" name="SCC" value={form.SCC} onChange={f}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Alcohol? (CALC)</label>
          <select className="form-select" name="CALC" value={form.CALC} onChange={f}>
            <option value="no">No</option><option>Sometimes</option><option>Frequently</option><option>Always</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Main transport (MTRANS)</label>
          <select className="form-select" name="MTRANS" value={form.MTRANS} onChange={f}>
            <option>Automobile</option><option>Bike</option><option>Motorbike</option>
            <option>Public_Transportation</option><option>Walking</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Estimating...' : 'Estimate Category'}</button>
    </form>
  )
}

// ---- Result display ----

// ── Risk colour helper (green / amber / red)
const riskColor = (pct) =>
  pct < 30 ? '#16a34a' : pct < 60 ? '#d97706' : '#dc2626'

const riskBgColor = (pct) =>
  pct < 30 ? '#dcfce7' : pct < 60 ? '#fef9c3' : '#fee2e2'

// ── Visual risk bar chart for binary risk results
const BinaryResult = ({ result, modelLabel }) => {
  if (!result) return null
  const pct = result.estimated_percentage
  const color = riskColor(pct)

  // Build chart data: one bar for risk, one for "safe" remainder
  const chartData = [
    {
      name: 'Estimated Risk',
      value: pct,
      fill: color
    },
    {
      name: 'No Risk Indicated',
      value: Math.max(0, 100 - pct),
      fill: '#e2e8f0'
    }
  ]

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title">Predicted Risk Probability — {modelLabel}</div>

      {/* Visual percentage display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1 }}>{pct}%</div>
        <div>
          <div style={{ marginBottom: 4 }}>
            Risk level:{' '}
            <span
              className="badge"
              style={{ background: riskBgColor(pct), color }}
            >
              {result.risk_level}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Estimated probability: <strong>{result.estimated_probability?.toFixed(4)}</strong>
          </div>
        </div>
      </div>

      {/* Horizontal stacked bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
          Risk visualisation
        </div>
        <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', background: '#e2e8f0' }}>
          <div
            style={{
              width: `${pct}%`,
              background: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              transition: 'width 0.6s ease',
              minWidth: pct > 10 ? undefined : 0
            }}
          >
            {pct >= 10 ? `${pct}%` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          <span>0%</span>
          <span style={{ color }}>Risk: {pct}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Recharts bar for detailed view */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>
          Risk breakdown
        </div>
        <ResponsiveContainer width="100%" height={70}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 120, bottom: 0 }}
            barSize={20}
          >
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={118} />
            <Tooltip formatter={(v) => [`${v}%`, '']} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
              <LabelList dataKey="value" position="right" formatter={v => `${v}%`} style={{ fontSize: 11, fill: '#1e293b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ml-disclaimer" style={{ marginTop: 12 }}>{result.disclaimer}</div>
    </div>
  )
}

const ObesityResult = ({ result }) => {
  if (!result) return null

  // Build recharts data for obesity class probabilities
  const obesityChartData = result.all_class_probabilities
    ? Object.entries(result.all_class_probabilities)
        .sort((a, b) => b[1] - a[1])
        .map(([cls, pct]) => ({ name: cls, value: pct }))
    : []

  const OBESITY_COLORS = ['#dc2626', '#d97706', '#d97706', '#16a34a', '#2563eb', '#7c3aed']

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-title">Predicted Obesity Category</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
          {result.predicted_category}
        </div>
        <span className="badge badge-blue">Confidence: {result.confidence}%</span>
      </div>

      {obesityChartData.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>
            All Category Probabilities
          </div>
          <ResponsiveContainer width="100%" height={obesityChartData.length * 38 + 20}>
            <BarChart
              data={obesityChartData}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 180, bottom: 0 }}
              barSize={20}
            >
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={178} />
              <Tooltip formatter={(v) => [`${v}%`, 'Probability']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {obesityChartData.map((_, i) => (
                  <Cell key={i} fill={OBESITY_COLORS[i % OBESITY_COLORS.length]} />
                ))}
                <LabelList dataKey="value" position="right" formatter={v => `${v}%`} style={{ fontSize: 11, fill: '#1e293b' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="ml-disclaimer">{result.disclaimer}</div>
    </div>
  )
}

// ---- Main page ----

const MODELS = [
  { key: 'diabetes',       label: 'Diabetes Risk',        desc: 'Estimate diabetes risk based on age, BMI, and health indicators.' },
  { key: 'hypertension',   label: 'Hypertension Risk',    desc: 'Estimate hypertension (high blood pressure) risk.' },
  { key: 'cardiovascular', label: 'Cardiovascular Risk',  desc: 'Estimate cardiovascular disease risk based on clinical indicators.' },
  { key: 'obesity',        label: 'Obesity Category',     desc: 'Estimate obesity classification from lifestyle and physical metrics.' },
]

const MLPrediction = () => {
  const [active, setActive]   = useState('diabetes')
  const [results, setResults] = useState({})

  const setResult = (model, data) => setResults(r => ({ ...r, [model]: data }))

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Health Risk Estimation</h1>
        <p className="page-subtitle">ML-based estimates — not medical diagnoses</p>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 20 }}>
        ⚠️ <strong>Important:</strong> These tools provide <em>model-estimated probabilities only</em>.
        They are NOT medical diagnoses. Always consult a healthcare professional.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {MODELS.map(m => (
          <button
            key={m.key}
            className={`btn ${active === m.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActive(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title">{MODELS.find(m => m.key === active)?.label}</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>{MODELS.find(m => m.key === active)?.desc}</p>

        {active === 'diabetes'       && <DiabetesForm     onResult={r => setResult('diabetes', r)}/>}
        {active === 'hypertension'   && <HypertensionForm onResult={r => setResult('hypertension', r)}/>}
        {active === 'cardiovascular' && <CardioForm       onResult={r => setResult('cardiovascular', r)}/>}
        {active === 'obesity'        && <ObesityForm      onResult={r => setResult('obesity', r)}/>}
      </div>

      {active !== 'obesity' && (
        <BinaryResult
          result={results[active]}
          modelLabel={MODELS.find(m => m.key === active)?.label}
        />
      )}
      {active === 'obesity' && <ObesityResult result={results['obesity']}/>}
    </Layout>
  )
}

export default MLPrediction
