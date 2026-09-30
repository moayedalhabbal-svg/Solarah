import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('table') // 'table' or 'calendar'

  const loadBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name), engineers(name)')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
    
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const updateStatus = async (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
    await supabase.from('bookings').update({ status: newStatus }).eq('id', id)
  }

  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }
  const statusColors = { confirmed: '#3B82F6', completed: '#10B981', cancelled: '#EF4444' }

  // Next 7 days
  const today = new Date()
  const next7Days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dStr = d.toISOString().split('T')[0]
    next7Days.push({ date: dStr, count: bookings.filter(b => b.date === dStr && b.status === 'confirmed').length })
  }

  // Monthly Calendar logic
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 15 + i)
    return d.toISOString().split('T')[0]
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setView('table')} style={{ ...btnStyle, background: view === 'table' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>Table View</button>
          <button onClick={() => setView('calendar')} style={{ ...btnStyle, background: view === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent' }}>Calendar View</button>
        </div>
      </div>

      {/* Upcoming summary */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: '2rem', paddingBottom: 8 }}>
        {next7Days.map(d => (
          <div key={d.date} style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 16px', minWidth: 100, textAlign: 'center' 
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '4px 0', color: d.count > 0 ? '#F5A623' : '#fff' }}>{d.count}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Bookings</div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading bookings...</div> : view === 'table' ? (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                <th style={{ padding: '12px 16px' }}>Ref</th>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Engineer</th>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Notes</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{b.booking_ref || b.id.slice(0,8)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.profiles?.full_name || 'Anonymous'}</td>
                  <td style={{ padding: '12px 16px' }}>{b.engineers?.name || b.engineer_id}</td>
                  <td style={{ padding: '12px 16px' }}>{b.date} <span style={{ color: 'rgba(255,255,255,0.5)' }}>{b.time}</span></td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.notes}>{b.notes || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select 
                      value={b.status} 
                      onChange={e => updateStatus(b.id, e.target.value)}
                      style={{ 
                        background: `${statusColors[b.status]}20`, color: statusColors[b.status], 
                        border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer'
                      }}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {/* Simple calendar grid placeholder */}
          {daysInMonth.map(d => {
            const dayBookings = bookings.filter(b => b.date === d)
            const isToday = d === today.toISOString().split('T')[0]
            return (
              <div key={d} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isToday ? '#F5A623' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: 8, minHeight: 100 }}>
                <div style={{ fontSize: 11, color: isToday ? '#F5A623' : 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'right' }}>{d.slice(5)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayBookings.map(b => (
                    <div key={b.id} style={{ fontSize: 10, background: `${statusColors[b.status]}20`, color: statusColors[b.status], padding: '2px 4px', borderRadius: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${b.engineers?.name} - ${b.time}`}>
                      {b.time} - {b.engineers?.name?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
