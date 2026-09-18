import { useEffect, useState } from 'react'
import { getAdminStats, getAdminWaitlistByDay, getAdminEngineers, toggleEngineerActive, supabase } from '../lib/supabase'
import styles from './Admin.module.css'

// ── Helpers ────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'unknown'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

export default function Admin({ user }) {
  const [stats, setStats] = useState(null)
  const [dailySignups, setDailySignups] = useState([])
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    // Realtime: live event feed
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadData() {
    const [s, w, e] = await Promise.all([
      getAdminStats(),
      getAdminWaitlistByDay(),
      getAdminEngineers(),
    ])
    setStats(s)
    setDailySignups(w.data || [])
    setEngineers(e.data || [])
    setLoading(false)
  }

  async function handleToggle(engId, currentActive) {
    await toggleEngineerActive(engId, !currentActive)
    setEngineers(prev => prev.map(e => e.id === engId ? { ...e, active: !currentActive } : e))
  }

  if (loading) return <div className={styles.loading}>Loading admin dashboard...</div>

  // ── Computed metrics ─────────────────────────────────────────────────
  const sectorBreakdown = groupBy(stats?.reports || [], 'sector')
  const statusBreakdown = groupBy(stats?.bookings || [], 'status')
  const clicksByCategory = groupBy(stats?.clicks || [], 'supplier')

  // Daily signups chart (last 30 days)
  const dailyMap = {}
  dailySignups.forEach(w => {
    const day = w.joined_at?.slice(0, 10)
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  const last30 = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    last30.push({ date: d, count: dailyMap[d] || 0 })
  }
  const maxDaily = Math.max(...last30.map(d => d.count), 1)

  // Revenue estimate
  const totalClicks = stats?.clicks?.length || 0
  const avgCommission = 25 // USD estimate per converted click
  const conversionRate = 0.02
  const revenueEstimate = Math.round(totalClicks * avgCommission * conversionRate)

  // Build event feed (combine recent waitlist, bookings, reports)
  const events = [
    ...(stats?.reports || []).slice(0, 20).map(r => ({
      type: 'report', time: r.created_at,
      text: `New report: ${r.system_kw} kWp ${r.sector || 'residential'} in ${r.region || 'Unknown'}`,
      icon: '📊', color: 'rgba(245,166,35,0.15)'
    })),
    ...(stats?.bookings || []).slice(0, 20).map(b => ({
      type: 'booking', time: b.created_at,
      text: `Booking: ${b.engineer_id} on ${b.date} at ${b.time} — ${b.status}`,
      icon: '📅', color: 'rgba(39,174,96,0.15)'
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20)

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className="section-label">Admin</div>
        <h1 className={styles.h1}>Solarah Dashboard</h1>
        <div className={styles.sub}>Live metrics and management</div>
      </div>

      {/* Top metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Waitlist signups</div>
          <div className={styles.metricVal} style={{ color: '#F5A623' }}>{stats?.waitlistCount?.toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Reports generated</div>
          <div className={styles.metricVal}>{(stats?.reports?.length || 0).toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total bookings</div>
          <div className={styles.metricVal} style={{ color: '#27AE60' }}>{(stats?.bookings?.length || 0).toLocaleString()}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Affiliate clicks</div>
          <div className={styles.metricVal}>{totalClicks.toLocaleString()}</div>
          <div className={styles.metricSub}>Est. revenue: ${revenueEstimate.toLocaleString()}</div>
        </div>
      </div>

      {/* Signups per day chart */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-chart-bar ${styles.sectionIcon}`} aria-hidden="true" />
          Waitlist signups — last 30 days
        </div>
        <div className={styles.chartWrap}>
          <div className={styles.chartBar}>
            {last30.map(d => (
              <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div className={styles.bar} style={{ height: `${(d.count / maxDaily) * 100}%` }} title={`${d.date}: ${d.count}`} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className={styles.barLabel}>{last30[0]?.date?.slice(5)}</span>
            <span className={styles.barLabel}>Today</span>
          </div>
        </div>
      </div>

      {/* Breakdowns */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-layout-grid ${styles.sectionIcon}`} aria-hidden="true" />
          Reports by sector
        </div>
        <div className={styles.breakdownGrid}>
          {Object.entries(sectorBreakdown).map(([k, v]) => (
            <div key={k} className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{k}</span>
              <span className={styles.breakdownVal}>{v}</span>
            </div>
          ))}
          {Object.keys(sectorBreakdown).length === 0 && (
            <div className={styles.breakdownItem}><span className={styles.breakdownLabel}>No reports yet</span></div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-calendar-stats ${styles.sectionIcon}`} aria-hidden="true" />
          Bookings by status
        </div>
        <div className={styles.breakdownGrid}>
          {Object.entries(statusBreakdown).map(([k, v]) => (
            <div key={k} className={styles.breakdownItem}>
              <span className={styles.breakdownLabel} style={{ color: k === 'confirmed' ? '#F5A623' : k === 'completed' ? '#27AE60' : '#E74C3C' }}>{k}</span>
              <span className={styles.breakdownVal}>{v}</span>
            </div>
          ))}
          {Object.keys(statusBreakdown).length === 0 && (
            <div className={styles.breakdownItem}><span className={styles.breakdownLabel}>No bookings yet</span></div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-click ${styles.sectionIcon}`} aria-hidden="true" />
          Affiliate clicks by category
        </div>
        <div className={styles.breakdownGrid}>
          {Object.entries(clicksByCategory).map(([k, v]) => (
            <div key={k} className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>{k}</span>
              <span className={styles.breakdownVal}>{v}</span>
            </div>
          ))}
          {Object.keys(clicksByCategory).length === 0 && (
            <div className={styles.breakdownItem}><span className={styles.breakdownLabel}>No clicks yet</span></div>
          )}
        </div>
      </div>

      {/* Live event feed */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-live-photo ${styles.sectionIcon}`} aria-hidden="true" />
          Live event feed
        </div>
        <div className={styles.feedList}>
          {events.length === 0 && (
            <div className={styles.feedItem}><span className={styles.feedText} style={{ color: 'rgba(255,255,255,0.3)' }}>No events yet</span></div>
          )}
          {events.map((ev, i) => (
            <div key={i} className={styles.feedItem}>
              <div className={styles.feedIcon} style={{ background: ev.color }}>{ev.icon}</div>
              <div className={styles.feedText}>{ev.text}</div>
              <div className={styles.feedTime}>{timeAgo(ev.time)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Engineer management */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className={`ti ti-users ${styles.sectionIcon}`} aria-hidden="true" />
          Engineer management
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.engTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Region</th>
                <th>Rating</th>
                <th>Reviews</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {engineers.map(eng => (
                <tr key={eng.id}>
                  <td style={{ fontWeight: 600 }}>{eng.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{eng.role}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{eng.region}</td>
                  <td>
                    <span style={{ color: '#F5A623' }}>★</span> {eng.rating}
                  </td>
                  <td>{eng.review_count}</td>
                  <td>
                    <button
                      className={`${styles.toggleBtn} ${eng.active ? styles.toggleActive : styles.toggleInactive}`}
                      onClick={() => handleToggle(eng.id, eng.active)}
                    >
                      {eng.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
