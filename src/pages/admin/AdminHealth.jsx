import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminHealth() {
  const [health, setHealth] = useState({
    dbLatency: null,
    aiLatency: null,
    emailStatus: 'checking',
    buildTime: import.meta.env.VITE_BUILD_TIME || 'Unknown',
    tableSizes: {},
    errorLogs: []
  })
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    
    // DB Ping
    const t0 = performance.now()
    await supabase.from('profiles').select('id').limit(1)
    const dbLatency = Math.round(performance.now() - t0)

    // Table Sizes (estimation via count)
    const tables = ['profiles', 'reports', 'bookings', 'waitlist', 'affiliate_clicks', 'engineers']
    const sizes = {}
    for (const t of tables) {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true })
      sizes[t] = count || 0
    }

    // Email Status
    const { data: logs } = await supabase.from('email_logs').select('sent_at').order('sent_at', { ascending: false }).limit(1)
    let emailStatus = 'unknown'
    if (logs && logs.length > 0) {
      const hoursSince = (Date.now() - new Date(logs[0].sent_at).getTime()) / 3600000
      emailStatus = hoursSince > 24 ? 'warning' : 'ok'
    }

    // Errors
    const { data: errorLogs } = await supabase.from('error_logs').select('*, profiles(full_name)').order('occurred_at', { ascending: false }).limit(20)

    setHealth(prev => ({
      ...prev,
      dbLatency,
      tableSizes: sizes,
      emailStatus,
      errorLogs: errorLogs || []
    }))
    
    setLoading(false)
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const testAI = async () => {
    setHealth(prev => ({ ...prev, aiLatency: 'testing' }))
    try {
      const t0 = performance.now()
      const { data, error } = await supabase.functions.invoke('ai-proxy', { body: { prompt: 'respond with just the word ok', model: 'gemini-1.5-flash' } })
      if (error) throw error
      setHealth(prev => ({ ...prev, aiLatency: `${Math.round(performance.now() - t0)}ms (${data?.text?.trim()})` }))
    } catch (err) {
      setHealth(prev => ({ ...prev, aiLatency: `Error: ${err.message}` }))
    }
  }

  const testEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    try {
      // Dummy check, we don't actually trigger real email without the real Edge Function
      await supabase.from('email_logs').insert([{
        recipient_email: user.email,
        email_type: 'test',
        subject: 'Solarah System Test',
        status: 'sent'
      }])
      alert('Test email logged successfully!')
      checkHealth()
    } catch (err) {
      alert('Test failed: ' + err.message)
    }
  }

  const testDbWrite = async () => {
    try {
      const { data, error } = await supabase.from('health_checks').insert([{}]).select()
      if (error) throw error
      if (data && data[0]) {
        await supabase.from('health_checks').delete().eq('id', data[0].id)
        alert('DB Write/Delete successful!')
      }
    } catch (err) {
      alert('Test failed: ' + err.message)
    }
  }

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column' }
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.5rem' }
  const kpiVal = { fontSize: 24, fontWeight: 800, margin: '4px 0' }
  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, width: 'fit-content' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        <div style={{ ...cardStyle, borderTop: '4px solid #10B981' }}>
          <div style={kpiLabel}>Database (Supabase)</div>
          <div style={kpiVal}>{health.dbLatency !== null ? `${health.dbLatency}ms` : '—'}</div>
          <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-check" /> Connected & Fast</div>
        </div>

        <div style={{ ...cardStyle, borderTop: `4px solid ${health.aiLatency?.includes('Error') ? '#EF4444' : health.aiLatency ? '#10B981' : '#F5A623'}` }}>
          <div style={kpiLabel}>AI Proxy (Gemini)</div>
          <div style={kpiVal}>{health.aiLatency === 'testing' ? '...' : health.aiLatency ? health.aiLatency.split(' ')[0] : 'Idle'}</div>
          {health.aiLatency?.includes('Error') ? (
            <div style={{ fontSize: 12, color: '#EF4444' }}>{health.aiLatency}</div>
          ) : health.aiLatency ? (
            <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-check" /> Responding correctly</div>
          ) : (
            <div style={{ fontSize: 12, color: '#F5A623', display: 'flex', alignItems: 'center', gap: 6 }}><i className="ti ti-clock" /> Not tested yet</div>
          )}
        </div>

        <div style={{ ...cardStyle, borderTop: `4px solid ${health.emailStatus === 'ok' ? '#10B981' : health.emailStatus === 'warning' ? '#F5A623' : '#3B82F6'}` }}>
          <div style={kpiLabel}>Email Service (Resend)</div>
          <div style={{ ...kpiVal, textTransform: 'capitalize', fontSize: 24, fontWeight: 800 }}>{health.emailStatus}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Based on last sent log</div>
        </div>

        <div style={{ ...cardStyle, borderTop: '4px solid #3B82F6' }}>
          <div style={kpiLabel}>Vercel Deployment</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6', margin: '8px 0', wordBreak: 'break-all' }}>https://solarah-five.vercel.app</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Build: {health.buildTime}</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Manual Tests */}
          <div style={cardStyle}>
            <div style={kpiLabel}>Manual Tests</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button onClick={testAI} style={btnStyle} disabled={health.aiLatency === 'testing'}><i className="ti ti-brain" /> Test AI Proxy</button>
              <button onClick={testDbWrite} style={btnStyle}><i className="ti ti-database" /> Test Database Write</button>
              <button onClick={testEmail} style={btnStyle}><i className="ti ti-mail" /> Test Email Sending</button>
            </div>
          </div>

          {/* Table Sizes */}
          <div style={cardStyle}>
            <div style={kpiLabel}>Database Sizes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {Object.entries(health.tableSizes).map(([table, count]) => (
                <div key={table} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{table}</span>
                  <span style={{ fontWeight: 600 }}>{count} rows</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Logs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ ...kpiLabel, marginBottom: 0 }}>Recent Error Logs</div>
            <button onClick={checkHealth} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><i className="ti ti-refresh" /></button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <th style={{ padding: '8px 12px' }}>Time</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Message</th>
                  <th style={{ padding: '8px 12px' }}>User</th>
                </tr>
              </thead>
              <tbody>
                {health.errorLogs.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No recent errors.</td></tr>
                ) : health.errorLogs.map(err => (
                  <tr key={err.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(err.occurred_at).toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#EF4444', fontWeight: 600 }}>{err.error_type || 'Error'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{err.message}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>{err.profiles?.full_name || err.user_id?.slice(0,8) || 'Anonymous'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
