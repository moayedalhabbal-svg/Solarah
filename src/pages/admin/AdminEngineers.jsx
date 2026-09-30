import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminEngineers() {
  const [engineers, setEngineers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Availability state
  const [selectedEngForSlots, setSelectedEngForSlots] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const loadEngineers = async () => {
    setLoading(true)
    const { data: engs, error } = await supabase.from('engineers').select('*, bookings(id)')
    if (!error) {
      setEngineers(engs.map(e => ({ ...e, bookingsCount: e.bookings?.length || 0 })))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEngineers()
  }, [])

  const toggleActive = async (id, current) => {
    // Optimistic
    setEngineers(prev => prev.map(e => e.id === id ? { ...e, active: !current } : e))
    await supabase.from('engineers').update({ active: !current }).eq('id', id)
  }

  const saveEngineer = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const id = fd.get('id') || fd.get('name').toLowerCase().replace(/[^a-z0-9]/g, '-')
    const payload = {
      id,
      name: fd.get('name'),
      role: fd.get('role'),
      avatar_initials: fd.get('name').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
      tags: fd.get('specializations').split(',').map(s => s.trim()).filter(Boolean),
      region: fd.get('region'),
    }

    if (editing?.id) {
      await supabase.from('engineers').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('engineers').insert([payload])
    }
    
    setIsModalOpen(false)
    loadEngineers()
  }

  // --- Availability Manager ---
  const loadSlots = async (engId, offset) => {
    if (!engId) { setSlots([]); return }
    setSlotsLoading(true)
    const d = new Date()
    d.setDate(d.getDate() + (offset * 7) - d.getDay() + 1) // Monday of offset week
    const start = d.toISOString().split('T')[0]
    
    const d2 = new Date(d)
    d2.setDate(d2.getDate() + 6)
    const end = d2.toISOString().split('T')[0]

    const { data } = await supabase.from('engineer_slots')
      .select('*')
      .eq('engineer_id', engId)
      .gte('date', start)
      .lte('date', end)
    
    setSlots(data || [])
    setSlotsLoading(false)
  }

  useEffect(() => {
    loadSlots(selectedEngForSlots, weekOffset)
  }, [selectedEngForSlots, weekOffset])

  const toggleSlot = async (dateStr, timeStr) => {
    if (!selectedEngForSlots) return
    const existing = slots.find(s => s.date === dateStr && s.time === timeStr)
    if (existing) {
      if (existing.booked) {
        alert('Cannot remove a booked slot!')
        return
      }
      setSlots(prev => prev.filter(s => s.id !== existing.id))
      await supabase.from('engineer_slots').delete().eq('id', existing.id)
    } else {
      const tempId = 'temp-' + Date.now()
      setSlots(prev => [...prev, { id: tempId, engineer_id: selectedEngForSlots, date: dateStr, time: timeStr, booked: false }])
      await supabase.from('engineer_slots').insert([{ engineer_id: selectedEngForSlots, date: dateStr, time: timeStr, booked: false }])
      loadSlots(selectedEngForSlots, weekOffset)
    }
  }

  // Helper for calendar UI
  const getDaysInWeek = (offset) => {
    const days = []
    const d = new Date()
    d.setDate(d.getDate() + (offset * 7) - d.getDay() + 1) // Mon
    for (let i = 0; i < 7; i++) {
      days.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      })
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  const hours = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']
  const currentWeekDays = getDaysInWeek(weekOffset)

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }
  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 6, color: '#fff', fontSize: 14, width: '100%', marginBottom: 12 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Engineers Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Engineer Marketplace</h2>
          <button style={{ ...btnStyle, background: '#F5A623', color: '#000', borderColor: '#F5A623', fontWeight: 600 }} onClick={() => { setEditing({}); setIsModalOpen(true) }}>
            + Add Engineer
          </button>
        </div>

        {loading ? <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading engineers...</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {engineers.map(eng => (
              <div key={eng.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                      {eng.avatar_initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{eng.name}</div>
                      <div style={{ fontSize: 12, color: '#F5A623' }}>★ {eng.rating} ({eng.review_count})</div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(eng.id, eng.active)} style={{
                    ...btnStyle, padding: '4px 8px', fontSize: 11, fontWeight: 600,
                    background: eng.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: eng.active ? '#10B981' : '#EF4444', borderColor: 'transparent'
                  }}>
                    {eng.active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{eng.role}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  <i className="ti ti-map-pin" /> {eng.region || 'Global'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {(eng.tags || []).slice(0,3).map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>{t}</span>
                  ))}
                  {(eng.tags || []).length > 3 && <span style={{ fontSize: 10, padding: '2px 8px' }}>+{eng.tags.length - 3}</span>}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{eng.bookingsCount} Bookings</div>
                  <button onClick={() => { setEditing(eng); setIsModalOpen(true) }} style={{ ...btnStyle, padding: '4px 12px' }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Manager */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Availability Manager</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select value={selectedEngForSlots} onChange={e => setSelectedEngForSlots(e.target.value)} style={{ ...inputStyle, width: 'auto', marginBottom: 0 }}>
              <option value="">Select an engineer...</option>
              {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.1)' }}>Bulk Add</button>
          </div>
        </div>

        {!selectedEngForSlots ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8 }}>
            Select an engineer above to manage their schedule.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <button onClick={() => setWeekOffset(o => o - 1)} style={btnStyle}><i className="ti ti-chevron-left" /> Prev Week</button>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Week of {currentWeekDays[0].label}</div>
              <button onClick={() => setWeekOffset(o => o + 1)} style={btnStyle}>Next Week <i className="ti ti-chevron-right" /></button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ width: 60, padding: 8, textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Time</th>
                    {currentWeekDays.map(d => (
                      <th key={d.dateStr} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hours.map(h => (
                    <tr key={h}>
                      <td style={{ textAlign: 'right', padding: '8px 12px 8px 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>{h}</td>
                      {currentWeekDays.map(d => {
                        const slot = slots.find(s => s.date === d.dateStr && s.time === h)
                        let bg = 'transparent'
                        let color = 'rgba(255,255,255,0.1)'
                        if (slot) {
                          if (slot.booked) {
                            bg = 'rgba(245,166,35,0.2)'
                            color = '#F5A623'
                          } else {
                            bg = 'rgba(16,185,129,0.2)'
                            color = '#10B981'
                          }
                        }
                        
                        return (
                          <td key={`${d.dateStr}-${h}`} style={{ padding: 4 }}>
                            <button
                              disabled={slotsLoading}
                              onClick={() => toggleSlot(d.dateStr, h)}
                              style={{
                                width: '100%', height: 32, borderRadius: 4, border: `1px solid ${color}`,
                                background: bg, cursor: slot?.booked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.1s'
                              }}
                              title={slot ? (slot.booked ? 'Booked' : 'Available (click to remove)') : 'Empty (click to add)'}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999 }} onClick={() => setIsModalOpen(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#0B1F3A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '2rem', width: '100%', maxWidth: 500, zIndex: 1000, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: 20 }}>{editing?.id ? 'Edit Engineer' : 'Add New Engineer'}</h2>
            <form onSubmit={saveEngineer}>
              {editing?.id && <input type="hidden" name="id" value={editing.id} />}
              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Full Name *</label>
              <input name="name" defaultValue={editing?.name} style={inputStyle} required />

              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Role / Headline</label>
              <input name="role" defaultValue={editing?.role} style={inputStyle} placeholder="e.g. MSc Energy Eng. · Cairo" />

              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Specializations (comma separated) *</label>
              <input name="specializations" defaultValue={editing?.tags?.join(', ')} style={inputStyle} required placeholder="e.g. Residential PV, Off-grid" />

              <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'rgba(255,255,255,0.6)' }}>Region</label>
              <select name="region" defaultValue={editing?.region || ''} style={inputStyle}>
                <option value="">Select a region...</option>
                <option value="North Africa / Middle East">North Africa / Middle East</option>
                <option value="Sub-Saharan Africa">Sub-Saharan Africa</option>
                <option value="Latin America">Latin America</option>
                <option value="Global">Global</option>
              </select>

              <div style={{ display: 'flex', gap: 12, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnStyle, background: 'transparent' }}>Cancel</button>
                <button type="submit" style={{ ...btnStyle, background: '#F5A623', color: '#000', fontWeight: 600 }}>Save Engineer</button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  )
}
