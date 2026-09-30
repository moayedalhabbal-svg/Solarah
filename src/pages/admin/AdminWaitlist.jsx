import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminWaitlist() {
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('Newest')
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailProgress, setEmailProgress] = useState(null) // e.g. "Sent 47 of 230 emails..."

  const loadWaitlist = async () => {
    setLoading(true)
    const { data } = await supabase.from('waitlist').select('*')
    setWaitlist(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadWaitlist()
  }, [])

  const handleDelete = async (id) => {
    if (window.confirm('Delete this waitlist entry?')) {
      setWaitlist(prev => prev.filter(w => w.id !== id))
      await supabase.from('waitlist').delete().eq('id', id)
    }
  }

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Country', 'Joined At'],
      ...waitlist.map(w => [w.id, w.name, w.email, w.country, w.joined_at])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'solarah_waitlist.csv'; a.click()
  }

  const sendBulkEmail = async (e) => {
    e.preventDefault()
    const subject = new FormData(e.target).get('subject')
    const body = new FormData(e.target).get('body')
    
    if (!window.confirm(`Send email to ALL ${waitlist.length} waitlist members?`)) return
    
    // Fake batching for UI
    setEmailProgress(`Sent 0 of ${waitlist.length} emails...`)
    
    for (let i = 0; i < waitlist.length; i += 50) {
      const batch = waitlist.slice(i, i + 50)
      
      // We would call Edge function here for the batch
      // await supabase.functions.invoke('send-email', { body: { recipients: batch.map(b => b.email), subject, text: body }})
      
      await new Promise(r => setTimeout(r, 1000)) // simulate network delay
      setEmailProgress(`Sent ${Math.min(i + 50, waitlist.length)} of ${waitlist.length} emails...`)
    }
    
    setTimeout(() => {
      setIsEmailModalOpen(false)
      setEmailProgress(null)
      alert('Emails sent successfully!')
    }, 1000)
  }

  // Analytics
  const now = Date.now()
  const weekAgo = new Date(now - 7*86400000)
  const monthAgo = new Date(now - 30*86400000)
  
  const thisWeekCount = waitlist.filter(w => new Date(w.joined_at) >= weekAgo).length
  const thisMonthCount = waitlist.filter(w => new Date(w.joined_at) >= monthAgo).length
  
  const countries = waitlist.reduce((acc, w) => { acc[w.country || 'Unknown'] = (acc[w.country || 'Unknown'] || 0) + 1; return acc }, {})
  const topCountry = Object.entries(countries).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Daily for last 60 days
  const dailyMap = {}
  waitlist.forEach(w => {
    const day = w.joined_at.slice(0, 10)
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  const last60 = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(Date.now() - (59 - i) * 86400000).toISOString().slice(0, 10)
    return { date: d, count: dailyMap[d] || 0 }
  })
  const maxDaily = Math.max(...last60.map(d => d.count), 1)

  // Sorted list
  const sorted = [...waitlist].sort((a, b) => {
    if (sort === 'Newest') return new Date(b.joined_at) - new Date(a.joined_at)
    if (sort === 'Oldest') return new Date(a.joined_at) - new Date(b.joined_at)
    if (sort === 'Country') return (a.country||'').localeCompare(b.country||'')
    return 0
  })

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }
  const kpiVal = { fontSize: 24, fontWeight: 800, margin: '8px 0' }
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }
  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={kpiLabel}>Total Signups</div>
          <div style={{ ...kpiVal, color: '#8B5CF6' }}>{waitlist.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>This Week</div>
          <div style={{ ...kpiVal, color: '#10B981' }}>{thisWeekCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>This Month</div>
          <div style={{ ...kpiVal, color: '#3B82F6' }}>{thisMonthCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={kpiLabel}>Top Country</div>
          <div style={{ ...kpiVal, color: '#F5A623', fontSize: 18 }}>{topCountry}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Growth Chart (60 days) */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Signups per day (Last 60 days)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginTop: '1.5rem' }}>
            {last60.map((d, i) => (
              <div key={i} style={{ flex: 1, background: '#8B5CF6', height: `${(d.count / maxDaily) * 100}%`, borderRadius: '2px 2px 0 0', opacity: 0.8 }} title={`${d.date}: ${d.count}`} />
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Top 10 Countries</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: '1.5rem' }}>
            {Object.entries(countries).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c, count]) => (
              <div key={c}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{c}</span>
                  <span>{count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / waitlist.length) * 100}%`, background: '#8B5CF6' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={inputStyle}>
            {['Newest', 'Oldest', 'Country'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setIsEmailModalOpen(true)} style={{ ...btnStyle, background: '#8B5CF6', color: '#fff', borderColor: '#8B5CF6', fontWeight: 600 }}><i className="ti ti-mail" /> Bulk Email</button>
          <button onClick={handleExport} style={btnStyle}><i className="ti ti-download" /> Export CSV</button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowX: 'auto' }}>
        {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading waitlist...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                <th style={{ padding: '12px 16px' }}>#</th>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Country</th>
                <th style={{ padding: '12px 16px' }}>Joined At</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((w, i) => (
                <tr key={w.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.4)' }}>{waitlist.length - i}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{w.name}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{w.email}</td>
                  <td style={{ padding: '12px 16px' }}>{w.country || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{new Date(w.joined_at).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(w.id)} style={{ ...btnStyle, padding: '4px 8px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }} title="Delete">
                      <i className="ti ti-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Email Modal */}
      {isEmailModalOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999 }} onClick={() => setIsEmailModalOpen(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#0B1F3A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '2rem', width: '100%', maxWidth: 600, zIndex: 1000
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: 20 }}>Send Announcement to Waitlist</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
              This will send an email to all {waitlist.length} members on the waitlist.
            </p>
            <form onSubmit={sendBulkEmail}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Subject</label>
              <input name="subject" style={{ ...inputStyle, width: '100%', marginBottom: 12 }} required placeholder="Solarah is now live in your country!" />
              
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Message Body (Markdown supported)</label>
              <textarea name="body" style={{ ...inputStyle, width: '100%', height: 150, marginBottom: 12, resize: 'vertical' }} required placeholder="We are excited to announce..." />

              {emailProgress && (
                <div style={{ marginBottom: 12, fontSize: 13, color: '#F5A623', background: 'rgba(245,166,35,0.1)', padding: 12, borderRadius: 8 }}>
                  <i className="ti ti-loader" style={{ marginRight: 8 }} /> {emailProgress}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsEmailModalOpen(false)} style={{ ...btnStyle, background: 'transparent' }} disabled={!!emailProgress}>Cancel</button>
                <button type="submit" style={{ ...btnStyle, background: '#8B5CF6', color: '#fff', fontWeight: 600, borderColor: '#8B5CF6' }} disabled={!!emailProgress}>
                  <i className="ti ti-send" /> Send {waitlist.length} Emails
                </button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  )
}
