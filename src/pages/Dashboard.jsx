import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserReports, getUserBookings, supabase } from '../lib/supabase'
import { getReportDesign } from '../lib/designConsumers'
import styles from './Dashboard.module.css'

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getUserReports(user.id).then(({ data }) => setReports(data || []))
    getUserBookings(user.id).then(({ data }) => setBookings(data || []))

    // Realtime: update bookings when status changes (engineer confirms/completes/cancels)
    const channel = supabase
      .channel('dashboard-bookings')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refetch all bookings on any change
        getUserBookings(user.id).then(({ data }) => setBookings(data || []))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, navigate])

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
            {(() => {
              const design = getReportDesign(latest, 'dashboard')
              return <>
                <div className={styles.metric}><div className={styles.metricLabel}>System</div><div className={styles.metricVal}>{design.systemKW ?? '—'} kWp</div><div className={styles.metricUnit}>{design.panels ?? '—'} panels</div></div>
                <div className={styles.metric}><div className={styles.metricLabel}>Savings/yr ({design.savingsCurrency || 'USD'})</div><div className={styles.metricVal} style={{color:'#27AE60'}}>{design.savingsCurrency || 'USD'} {design.annualSavings?.toLocaleString() ?? '—'}</div><div className={styles.metricUnit}>estimated{design.reportSource === 'recomputed' ? '' : ' · saved snapshot; not converted'}</div></div>
                <div className={styles.metric}><div className={styles.metricLabel}>Payback</div><div className={styles.metricVal}>{design.payback ?? '—'}</div><div className={styles.metricUnit}>{design.paybackStatus === 'currency_mismatch' ? 'currency mismatch' : design.payback == null ? 'not reached / unavailable' : 'years'}</div></div>
                <div className={styles.metric}><div className={styles.metricLabel}>25yr savings ({design.savingsCurrency || 'USD'})</div><div className={styles.metricVal} style={{color:'#F5A623'}}>{design.savingsCurrency || 'USD'} {design.lifetimeSavings?.toLocaleString() ?? '—'}</div><div className={styles.metricUnit}>{design.reportSource === 'recomputed' ? 'forecast' : 'saved snapshot; not converted'}</div></div>
              </>
            })()}
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
            {reports.slice(1).map(r => {
              const design = getReportDesign(r, 'dashboard')
              return <div key={r.id} className={styles.reportItem}>
                <div className={styles.reportIcon}><i className="ti ti-file-description" aria-hidden="true" /></div>
                <div className={styles.reportInfo}>
                  <div className={styles.reportName}>{design.systemKW ?? '—'} kWp — {r.city || r.region}</div>
                  <div className={styles.reportMeta}>{new Date(r.created_at).toLocaleDateString()} · {design.savingsCurrency || 'USD'} {design.annualSavings?.toLocaleString() ?? '—'}/yr savings{design.reportSource === 'recomputed' ? '' : ' · saved snapshot; not converted'}</div>
                </div>
              </div>
            })}
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
              <span className={styles.bookingStatus} style={{ color: b.status === 'confirmed' ? '#F5A623' : b.status === 'completed' ? '#27AE60' : '#E74C3C' }}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
