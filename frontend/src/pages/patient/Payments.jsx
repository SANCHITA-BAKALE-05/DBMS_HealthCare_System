import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { paymentAPI } from '../../services/api'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    paymentAPI.getMine()
      .then(r => setPayments(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = { PAID:'badge-green', PENDING:'badge-yellow', FAILED:'badge-red', REFUNDED:'badge-blue' }
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
  }

  const total = payments.filter(p => p.payment_status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 400 }}>
        <div className="stat-card">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value">₹{total.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{payments.length}</div>
        </div>
      </div>

      <div className="card">
        {loading
          ? <div className="loading-wrap"><div className="spinner"/></div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Payment ID</th><th>Date</th><th>Doctor</th><th>Amount</th><th>Method</th><th>Status</th><th>Reference</th></tr></thead>
                <tbody>
                  {payments.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center' }}>No payment records.</td></tr>}
                  {payments.map(p => (
                    <tr key={p.payment_id}>
                      <td>{p.payment_id}</td>
                      <td>{p.payment_date?.slice(0,10)}</td>
                      <td>Dr. {p.doctor_name}</td>
                      <td>₹{Number(p.amount).toFixed(2)}</td>
                      <td>{p.payment_method}</td>
                      <td>{statusBadge(p.payment_status)}</td>
                      <td>{p.transaction_reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </Layout>
  )
}

export default Payments
