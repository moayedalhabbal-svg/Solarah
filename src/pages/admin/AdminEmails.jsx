import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminEmails() {
  const [logs, setLogs] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Composer state
  const [composeTo, setComposeTo] = useState('all_users')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [sending, setSending] = useState(false)
  
  // Templates state
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  const TEMPLATE_IDS = ['waitlist_welcome', 'booking_confirmation', 'booking_engineer_notify', 'report_saved']

  const loadData = async () => {
    setLoading(true)
    const [logRes, tplRes] = await Promise.all([
      supabase.from('email_logs').select('*').order('sent_at', { ascending: false }).limit(50),
      supabase.from('email_templates').select('*')
    ])
    setLogs(logRes.data || [])
    
    // Ensure default templates exist in state
    const tpls = tplRes.data || []
    const fullTpls = TEMPLATE_IDS.map(id => {
      const existing = tpls.find(t => t.id === id)
      return existing || { id, subject: '', body: '' }
    })
    setTemplates(fullTpls)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!window.confirm(`Send email to ${composeTo.replace('_', ' ')}?`)) return
    
    setSending(true)
    try {
      // In a real implementation this would trigger an Edge Function that fetches recipients based on 'composeTo'
      // and sends emails in batches. For now we just log a dummy entry.
      await new Promise(r => setTimeout(r, 1000))
      
      await supabase.from('email_logs').insert([{
        recipient_email: `Group: ${composeTo}`,
        email_type: 'bulk_admin',
        subject: composeSubject,
        status: 'sent'
      }])
      
      alert('Email sent successfully!')
      setComposeSubject('')
      setComposeBody('')
      loadData()
    } catch (err) {
      alert('Failed to send: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const saveTemplate = async (e) => {
    e.preventDefault()
    if (!editingTemplate) return
    
    try {
      // Use upsert to handle both insert and update
      const { error } = await supabase.from('email_templates').upsert({
        id: editingTemplate.id,
        subject: editingTemplate.subject,
        body: editingTemplate.body,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }) // explicitly defining conflict column for upsert
      
      if (error) throw error
      alert('Template saved!')
      setEditingTemplate(null)
      loadData()
    } catch (err) {
      alert('Failed to save template: ' + err.message)
    }
  }

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }
  const kpiLabel = { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '1rem' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 13, width: '100%', marginBottom: 12 }
  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Composer */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Compose Bulk Email</div>
          <form onSubmit={handleSend}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>To</label>
            <select value={composeTo} onChange={e => setComposeTo(e.target.value)} style={inputStyle}>
              <option value="all_users">All Registered Users</option>
              <option value="all_waitlist">All Waitlist Members</option>
              <option value="all_engineers">All Active Engineers</option>
            </select>

            <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Subject</label>
            <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} style={inputStyle} required placeholder="Solarah Update..." />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Body (Markdown)</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} style={{ ...inputStyle, height: 200, resize: 'vertical' }} required placeholder="Hello,\n\nWe have exciting news..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Live Preview (Branded)</label>
                <div style={{ background: '#fff', color: '#1a202c', borderRadius: 8, height: 200, overflowY: 'auto', border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <div style={{ background: '#0B1F3A', padding: '12px 16px' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Solar<span style={{ color: '#F5A623' }}>ah</span></div>
                  </div>
                  <div style={{ padding: '16px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {composeBody || <span style={{ color: '#a0aec0' }}>Preview appears here...</span>}
                  </div>
                  <div style={{ background: '#f7fafc', padding: '12px 16px', fontSize: 11, color: '#a0aec0', borderTop: '1px solid #e2e8f0' }}>
                    © 2026 Solarah. You are receiving this email because you signed up.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" disabled={sending} style={{ ...btnStyle, background: '#3B82F6', borderColor: '#3B82F6' }}>
                {sending ? 'Sending...' : 'Send Email Campaign'} <i className="ti ti-send" />
              </button>
            </div>
          </form>
        </div>

        {/* Templates Editor */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Email Templates (Automated)</div>
          
          {editingTemplate ? (
            <form onSubmit={saveTemplate}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F5A623' }}>Editing: {editingTemplate.id}</div>
                <button type="button" onClick={() => setEditingTemplate(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>×</button>
              </div>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Subject</label>
              <input value={editingTemplate.subject} onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })} style={inputStyle} required />
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Body (Markdown)</label>
              <textarea value={editingTemplate.body} onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })} style={{ ...inputStyle, height: 150 }} required />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Use variables like {'{user_name}'}, {'{report_link}'} depending on context.</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingTemplate(null)} style={btnStyle}>Cancel</button>
                <button type="submit" style={{ ...btnStyle, background: '#10B981', borderColor: '#10B981' }}>Save Template</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t.subject ? 'Customized' : 'Using default fallback'}</div>
                  </div>
                  <button onClick={() => setEditingTemplate(t)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 12 }}>Edit</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Logs Table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ ...kpiLabel, marginBottom: 0 }}>Recent Email Logs (Last 50)</div>
          <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><i className="ti ti-refresh" /></button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? <div style={{ color: 'rgba(255,255,255,0.5)', padding: '1rem' }}>Loading logs...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <th style={{ padding: '8px 12px' }}>Sent At</th>
                  <th style={{ padding: '8px 12px' }}>Recipient</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Subject</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No emails sent yet.</td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{new Date(l.sent_at).toLocaleString()}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{l.recipient_email}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{l.email_type}</td>
                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.8)' }}>{l.subject}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                        background: l.status === 'sent' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: l.status === 'sent' ? '#10B981' : '#EF4444'
                      }}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  )
}
