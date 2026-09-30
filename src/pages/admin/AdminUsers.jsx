import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [page, setPage] = useState(1)
  
  const [selectedUser, setSelectedUser] = useState(null) // for slide-over
  const [userDetails, setUserDetails] = useState(null)

  const ITEMS_PER_PAGE = 25

  const loadUsers = async () => {
    setLoading(true)
    // In a real app we'd paginate on the server. For simplicity here, fetch all profiles and join with auth.users if we could.
    // Supabase auth.users is only accessible via admin API. We'll use profiles and fetch other details.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*, reports(id, created_at), bookings(id, created_at)')
    
    if (!error) {
      const formatted = profiles.map(p => {
        const repCount = p.reports?.length || 0
        const bookCount = p.bookings?.length || 0
        const lastActive = Math.max(
          new Date(p.created_at).getTime(),
          ...p.reports.map(r => new Date(r.created_at).getTime()),
          ...p.bookings.map(b => new Date(b.created_at).getTime())
        )
        return { ...p, repCount, bookCount, lastActive }
      })
      setUsers(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Derived state
  let filtered = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (u.id?.toLowerCase() || '').includes(search.toLowerCase()) // missing email in profiles typically, we'll search by name
  )
  if (filter !== 'All') {
    filtered = filtered.filter(u => {
      if (filter === 'Users') return u.role === 'user'
      if (filter === 'Engineers') return u.role === 'engineer'
      if (filter === 'Admins') return u.role === 'admin'
      return true
    })
  }

  filtered.sort((a, b) => {
    if (sort === 'Newest') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'Oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sort === 'Most reports') return b.repCount - a.repCount
    if (sort === 'Most bookings') return b.bookCount - a.bookCount
    return 0
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const displayed = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleExport = () => {
    const csv = [
      ['ID', 'Name', 'Role', 'Country', 'Joined', 'Reports', 'Bookings'],
      ...filtered.map(u => [u.id, u.full_name, u.role, u.country, u.created_at, u.repCount, u.bookCount])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'solarah_users.csv'; a.click()
  }

  const openUser = async (user) => {
    setSelectedUser(user)
    const [r, b, c] = await Promise.all([
      supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('affiliate_clicks').select('*').eq('user_id', user.id).order('clicked_at', { ascending: false })
    ])
    setUserDetails({ reports: r.data || [], bookings: b.data || [], clicks: c.data || [] })
  }

  const changeRole = async (userId, currentRole) => {
    const newRole = window.prompt(`Change role for user (current: ${currentRole}). Enter 'user', 'engineer', or 'admin':`, currentRole)
    if (newRole && ['user', 'engineer', 'admin'].includes(newRole)) {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      loadUsers()
    }
  }

  const deleteUser = async (userId) => {
    const confirm = window.prompt('DANGER: Type the user ID to confirm deletion:')
    if (confirm === userId) {
      // Deleting profile cascades or we need edge function to delete auth user.
      await supabase.from('profiles').delete().eq('id', userId)
      loadUsers()
    }
  }

  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13 }

  return (
    <div style={{ position: 'relative' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1) }} 
            style={inputStyle}
          />
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} style={inputStyle}>
            {['All', 'Users', 'Engineers', 'Admins'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} style={inputStyle}>
            {['Newest', 'Oldest', 'Most reports', 'Most bookings'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={handleExport} style={btnStyle}><i className="ti ti-download" /> Export CSV</button>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowX: 'auto' }}>
        {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading users...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Country</th>
                <th style={{ padding: '12px 16px' }}>Joined</th>
                <th style={{ padding: '12px 16px' }}>Activity</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {(u.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => openUser(u)}>{u.full_name || 'Anonymous User'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{u.id.slice(0,8)}...</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'engineer' ? 'rgba(245,166,35,0.15)' : 'rgba(59,130,246,0.15)',
                      color: u.role === 'admin' ? '#EF4444' : u.role === 'engineer' ? '#F5A623' : '#3B82F6'
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>{u.country || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>
                    {u.repCount} R · {u.bookCount} B
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openUser(u)} style={{ ...btnStyle, padding: '4px 8px' }} title="View profile"><i className="ti ti-eye" /></button>
                      <button onClick={() => changeRole(u.id, u.role)} style={{ ...btnStyle, padding: '4px 8px' }} title="Change role"><i className="ti ti-shield" /></button>
                      <button onClick={() => deleteUser(u.id)} style={{ ...btnStyle, padding: '4px 8px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }} title="Delete user"><i className="ti ti-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          <div>Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnStyle}>Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnStyle}>Next</button>
          </div>
        </div>
      )}

      {/* Slide-over Profile Panel */}
      {selectedUser && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSelectedUser(null)} />
          <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 450, 
            background: '#0B1F3A', borderLeft: '1px solid rgba(255,255,255,0.1)', 
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            transform: 'translateX(0)', transition: 'transform 0.3s'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>User Profile</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
                  {(selectedUser.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedUser.full_name || 'Anonymous'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>ID: {selectedUser.id}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Joined: {new Date(selectedUser.created_at).toLocaleString()}</div>
                </div>
              </div>

              {!userDetails ? <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading details...</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  <div>
                    <h3 style={{ fontSize: 14, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Saved Reports ({userDetails.reports.length})</h3>
                    {userDetails.reports.length === 0 ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No reports</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetails.reports.map(r => (
                          <div key={r.id} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 13 }}>
                            <div style={{ fontWeight: 600 }}>{r.system_kw} kWp {r.sector}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(r.created_at).toLocaleDateString()} · {r.region || 'Unknown location'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: 14, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Bookings ({userDetails.bookings.length})</h3>
                    {userDetails.bookings.length === 0 ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No bookings</div> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {userDetails.bookings.map(b => (
                          <div key={b.id} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>Engineer ID: {b.engineer_id}</div>
                              <div style={{ color: 'rgba(255,255,255,0.5)' }}>{b.date} at {b.time}</div>
                            </div>
                            <div style={{ color: b.status === 'confirmed' ? '#3B82F6' : b.status === 'completed' ? '#10B981' : '#EF4444' }}>{b.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: 14, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Raw JSON Data</h3>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedUser, null, 2)}
                    </pre>
                  </div>

                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
