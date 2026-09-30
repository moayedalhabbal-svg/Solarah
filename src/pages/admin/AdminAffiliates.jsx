import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminAffiliates() {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')

  const loadClicks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('affiliate_clicks')
      .select('*, profiles(full_name, id, country)')
      .order('clicked_at', { ascending: false })
    
    setClicks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadClicks()
  }, [])

  const COMMISSION_RATE = 0.03
  const CONVERSION_RATE = 0.02
  const AVG_AOV = 800

  // Metrics
  const totalClicks = clicks.length
  const estConversions = Math.round(totalClicks * CONVERSION_RATE)
  const estRevenue = estConversions * AVG_AOV * COMMISSION_RATE

  // Top Product
  const productCounts = clicks.reduce((acc, c) => {
    const key = `${c.product_name} (${c.supplier})`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topProduct = Object.entries(productCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Breakdown table
  const productStatsMap = clicks.reduce((acc, c) => {
    const key = `${c.product_name}|${c.supplier}`
    if (!acc[key]) {
      acc[key] = { name: c.product_name, supplier: c.supplier, clicks: 0, lastClick: c.clicked_at }
    }
    acc[key].clicks += 1
    if (new Date(c.clicked_at) > new Date(acc[key].lastClick)) {
      acc[key].lastClick = c.clicked_at
    }
    return acc
  }, {})
  const productStats = Object.values(productStatsMap).sort((a,b) => b.clicks - a.clicks)

  // Chart: last 30 days
  const dailyMap = { panels: {}, inverters: {}, batteries: {} }
  clicks.forEach(c => {
    const day = c.clicked_at.slice(0, 10)
    let cat = 'panels'
    if (c.supplier?.toLowerCase().includes('inverter') || c.product_name?.toLowerCase().includes('inverter')) cat = 'inverters'
    else if (c.supplier?.toLowerCase().includes('battery') || c.product_name?.toLowerCase().includes('battery') || c.product_name?.toLowerCase().includes('lfp')) cat = 'batteries'
    
    dailyMap[cat][day] = (dailyMap[cat][day] || 0) + 1
  })

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10)
    return { date: d, panels: dailyMap.panels[d] || 0, inverters: dailyMap.inverters[d] || 0, batteries: dailyMap.batteries[d] || 0 }
  })
  
  const maxDaily = Math.max(1, ...last30.map(d => d.panels + d.inverters + d.batteries))

  // Countries
  const countryCounts = clicks.reduce((acc, c) => {
    const cname = c.profiles?.country || 'Anonymous / Unknown'
    acc[cname] = (acc[cname] || 0) + 1
    return acc
  }, {})

  // User History
  const userHistory = userSearch ? clicks.filter(c => (c.profiles?.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || (c.user_id || '').includes(userSearch)) : []

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }
  const kpiVal = { fontSize: 24, fontWeight: 800, margin: '8px 0' }
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, width: '100%' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={kpiLabel}>Total Clicks</div>
          <div style={{ ...kpiVal, color: '#EC4899' }}>{totalClicks}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Est. Conversions</div>
          <div style={{ ...kpiVal, color: '#3B82F6' }}>{estConversions}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>2% conversion rate</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Est. Revenue</div>
          <div style={{ ...kpiVal, color: '#10B981' }}>${Math.round(estRevenue)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>3% commission, $800 AOV</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Top Product</div>
          <div style={{ ...kpiVal, color: '#F5A623', fontSize: 16 }}>{topProduct}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={kpiLabel}>Clicks over time (30 days)</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }}/> Panels</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F5A623' }}/> Inverters</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}/> Batteries</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, position: 'relative' }}>
            {/* Y-axis lines could go here */}
            {last30.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', height: '100%', justifyContent: 'flex-start' }} title={d.date}>
                <div style={{ height: `${(d.panels / maxDaily) * 100}%`, background: '#3B82F6', width: '100%' }} />
                <div style={{ height: `${(d.inverters / maxDaily) * 100}%`, background: '#F5A623', width: '100%' }} />
                <div style={{ height: `${(d.batteries / maxDaily) * 100}%`, background: '#10B981', width: '100%' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Clicks by Country</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '1.5rem', maxHeight: 200, overflowY: 'auto' }}>
            {Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).map(([c, count]) => (
              <div key={c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{c}</span>
                  <span>{count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / totalClicks) * 100}%`, background: '#EC4899' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div style={cardStyle}>
        <div style={kpiLabel}>Product Breakdown</div>
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                <th style={{ padding: '8px 12px' }}>Product</th>
                <th style={{ padding: '8px 12px' }}>Supplier</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Clicks</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Est. Conv</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Est. Rev</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Last Click</th>
              </tr>
            </thead>
            <tbody>
              {productStats.map((p, i) => {
                const conv = Math.round(p.clicks * CONVERSION_RATE)
                const rev = Math.round(conv * AVG_AOV * COMMISSION_RATE)
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>{p.supplier}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#EC4899', fontWeight: 700 }}>{p.clicks}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{conv}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10B981' }}>${rev}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{new Date(p.lastClick).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User History */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={kpiLabel}>User Click History</div>
          <input 
            type="text" 
            placeholder="Search user name or ID..." 
            value={userSearch} 
            onChange={e => setUserSearch(e.target.value)} 
            style={{ ...inputStyle, width: 300, padding: '4px 8px' }}
          />
        </div>
        
        {userSearch && userHistory.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>No clicks found for this user.</div>}
        {userSearch && userHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {userHistory.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{c.product_name}</span> <span style={{ color: 'rgba(255,255,255,0.5)' }}>({c.supplier})</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{c.profiles?.full_name || 'Anonymous'}</span>
                  <span style={{ color: '#F5A623', fontSize: 11 }}>{new Date(c.clicked_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!userSearch && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Type a name above to view their click history.</div>}
      </div>

    </div>
  )
}
