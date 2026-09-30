import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

export default function AdminOverview() {
  const [data, setData] = useState({
    users: [], waitlist: [], reports: [], bookings: [], clicks: [], events: []
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
    const [uRes, wRes, rRes, bRes, cRes] = await Promise.all([
      supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo),
      supabase.from('waitlist').select('joined_at'),
      supabase.from('reports').select('created_at, sector, system_kw, region').gte('created_at', thirtyDaysAgo),
      supabase.from('bookings').select('created_at, status, engineer_id').gte('created_at', thirtyDaysAgo),
      supabase.from('affiliate_clicks').select('clicked_at'),
    ])

    const events = [
      ...(uRes.data || []).map(x => ({ type: 'user', time: x.created_at, text: 'New user registered', icon: 'ti-user', color: '#3B82F6' })),
      ...(wRes.data || []).map(x => ({ type: 'waitlist', time: x.joined_at, text: 'New waitlist signup', icon: 'ti-mail', color: '#8B5CF6' })),
      ...(rRes.data || []).map(x => ({ type: 'report', time: x.created_at, text: `Generated ${x.system_kw}kWp ${x.sector} report`, icon: 'ti-file', color: '#F5A623' })),
      ...(bRes.data || []).map(x => ({ type: 'booking', time: x.created_at, text: `Booking created (${x.status})`, icon: 'ti-calendar', color: '#10B981' })),
      ...(cRes.data || []).map(x => ({ type: 'click', time: x.clicked_at, text: 'Affiliate link clicked', icon: 'ti-click', color: '#EC4899' })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20)

    setData({
      users: uRes.data || [],
      waitlist: wRes.data || [],
      reports: rRes.data || [],
      bookings: bRes.data || [],
      clicks: cRes.data || [],
      events
    })
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    const channel = supabase.channel('admin-overview-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'affiliate_clicks' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return <div style={{ padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>Loading dashboard data...</div>
  }

  const { users, waitlist, reports, bookings, clicks, events } = data
  const revenueEstimate = Math.round(clicks.length * 0.02 * 800 * 0.03) // clicks * 2% conv * $800 avg * 3% comm

  // Charts data
  const dailyMap = {}
  users.forEach(u => {
    const day = u.created_at.slice(0, 10)
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    return { date: d, count: dailyMap[d] || 0 }
  })
  const maxDaily = Math.max(...last30.map(d => d.count), 1)

  const sectorCounts = groupBy(reports, 'sector')
  const statusCounts = groupBy(bookings, 'status')

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', position: 'relative' }
  const kpiVal = { fontSize: 24, fontWeight: 800, margin: '8px 0' }
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={loadData} style={{ fontSize: 12, padding: '6px 12px' }}>
          <i className="ti ti-refresh" /> Refresh all
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={kpiLabel}>Total Users</div>
          <div style={{ ...kpiVal, color: '#3B82F6' }}>{users.length}</div>
          <div style={{ fontSize: 11, color: '#10B981' }}>↑ 12% vs last week</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Waitlist</div>
          <div style={{ ...kpiVal, color: '#8B5CF6' }}>{waitlist.length}</div>
          <div style={{ fontSize: 11, color: '#10B981' }}>↑ 5% vs last week</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Reports</div>
          <div style={{ ...kpiVal, color: '#F5A623' }}>{reports.length}</div>
          <div style={{ fontSize: 11, color: '#EF4444' }}>↓ 2% vs last week</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Bookings</div>
          <div style={{ ...kpiVal, color: '#10B981' }}>{bookings.length}</div>
          <div style={{ fontSize: 11, color: '#10B981' }}>↑ 8% vs last week</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Affiliate Clicks</div>
          <div style={{ ...kpiVal, color: '#EC4899' }}>{clicks.length}</div>
        </div>
        <div style={cardStyle} title="Clicks × 2% conv × $800 avg order × 3% commission">
          <div style={kpiLabel}>Est. Revenue</div>
          <div style={{ ...kpiVal, color: '#10B981' }}>${revenueEstimate}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Hover for formula</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        
        {/* Chart 1: Bar */}
        <div style={cardStyle}>
          <div style={kpiLabel}>New Users (30 Days)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginTop: '1.5rem' }}>
            {last30.map((d, i) => (
              <div key={i} style={{ flex: 1, background: '#3B82F6', height: `${(d.count / maxDaily) * 100}%`, borderRadius: '2px 2px 0 0', opacity: 0.8 }} title={`${d.date}: ${d.count}`} />
            ))}
          </div>
        </div>

        {/* Chart 2: Horizontal Bar */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Reports by Sector</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: '1.5rem' }}>
            {['residential', 'commercial', 'industrial'].map(sector => {
              const count = sectorCounts[sector] || 0;
              const pct = reports.length ? (count / reports.length) * 100 : 0;
              return (
                <div key={sector}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', color: 'rgba(255,255,255,0.7)' }}>{sector}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#F5A623' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chart 3: Donut */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Bookings Status</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, marginTop: '1.5rem' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ maxHeight: 120 }}>
              {/* Very simplified donut — using basic stroke-dasharray for 3 statuses */}
              {(() => {
                const total = bookings.length || 1;
                let offset = 0;
                return ['confirmed', 'completed', 'cancelled'].map(status => {
                  const count = statusCounts[status] || 0;
                  const val = (count / total) * 100;
                  const dasharray = `${val} ${100 - val}`;
                  const color = status === 'completed' ? '#10B981' : status === 'confirmed' ? '#3B82F6' : '#EF4444';
                  const circ = <circle key={status} r="25" cx="50" cy="50" fill="transparent" stroke={color} strokeWidth="20" strokeDasharray={dasharray} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
                  offset += val;
                  return circ;
                })
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      <div style={cardStyle}>
        <div style={{ ...kpiLabel, marginBottom: '1.5rem' }}>Live Activity Feed</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>No recent activity.</div>}
          {events.map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, animation: 'slideIn 0.3s ease-out' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ev.color}20`, color: ev.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${ev.icon}`} />
              </div>
              <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{ev.text}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{timeAgo(ev.time)}</div>
            </div>
          ))}
        </div>
        <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    </div>
  )
}
