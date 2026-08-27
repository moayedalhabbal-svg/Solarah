import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserReports, getUserBookings } from '../lib/supabase'
import styles from './Dashboard.module.css'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getUserReports(user.id).then(({ data }) => setReports(data || []))
    getUserBookings(user.id).then(({ data }) => setBookings(data || []))
  }, [user])

  const latest = reports[0]

  return (
    <div className={styles.wrap}>
      <div className={styles.welcome}>
        <div>
          <div className="section-label">Your dashboard</div>
          <h1 className={styles.h1}>Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/calculator')}>
          <i className="ti ti-plus" aria-hidden="true" /> New report
        </button>
      </div>

      {/* Latest system */}
      {latest ? (
        <div className={styles.latestCard}>
          <div className={styles.latestHeader}>
            <div className={styles.latestTitle}>Latest system design</div>
            <div className={styles.latestDate}>{new Date(latest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}><div className={styles.metricLabel}>System</div><div className={styles.metricVal}>{latest.system_kw} kWp</div><div className={styles.metricUnit}>{latest.panel_count} panels</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>Savings/yr</div><div className={styles.metricVal} style={{color:'#27AE60'}}>{latest.currency} {latest.annual_savings?.toLocaleString()}</div><div className={styles.metricUnit}>estimated</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>Payback</div><div className={styles.metricVal}>{latest.payback_years}</div><div className={styles.metricUnit}>years</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>25yr savings</div><div className={styles.metricVal} style={{color:'#F5A623'}}>{latest.currency} {latest.lifetime_savings?.toLocaleString()}</div><div className={styles.metricUnit}>forecast</div></div>
          </div>
          <div className={styles.latestActions}>
            <button className="btn-primary" onClick={() => navigate('/engineers')}><i className="ti ti-calendar" aria-hidden="true" /> Book consultation</button>
            <button className="btn-secondary" onClick={() => navigate('/products')}><i className="ti ti-shopping-cart" aria-hidden="true" /> View products</button>
          </div>
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <i className="ti ti-solar-panel" aria-hidden="true" style={{ fontSize: 32, color: '#F5A623', marginBottom: 12 }} />
          <div className={styles.emptyTitle}>No reports yet</div>
          <div className={styles.emptySub}>Run the calculator to get your first system design.</div>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/calculator')}>
            <i className="ti ti-calculator" aria-hidden="true" /> Design my system
          </button>
        </div>
      )}

      {/* Past reports */}
      {reports.length > 1 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Past reports</div>
          <div className={styles.reportList}>
            {reports.slice(1).map(r => (
              <div key={r.id} className={styles.reportItem}>
                <div className={styles.reportIcon}><i className="ti ti-file-description" aria-hidden="true" /></div>
                <div className={styles.reportInfo}>
                  <div className={styles.reportName}>{r.system_kw} kWp — {r.city || r.region}</div>
                  <div className={styles.reportMeta}>{new Date(r.created_at).toLocaleDateString()} · {r.currency} {r.annual_savings?.toLocaleString()}/yr savings</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings */}
      {bookings.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Upcoming consultations</div>
          {bookings.map(b => (
            <div key={b.id} className={styles.bookingItem}>
              <div className={styles.bookingIcon}><i className="ti ti-video" aria-hidden="true" /></div>
              <div>
                <div className={styles.bookingName}>{b.engineers?.name || 'Engineer'}</div>
                <div className={styles.bookingMeta}>{b.date} at {b.time} · {b.booking_ref}</div>
              </div>
              <span className={styles.bookingStatus}>Confirmed</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
