import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import AdminOverview from './admin/AdminOverview'
import AdminUsers from './admin/AdminUsers'
import AdminEngineers from './admin/AdminEngineers'
import AdminReports from './admin/AdminReports'
import AdminBookings from './admin/AdminBookings'
import AdminWaitlist from './admin/AdminWaitlist'
import AdminAffiliates from './admin/AdminAffiliates'
import AdminEmails from './admin/AdminEmails'
import AdminHealth from './admin/AdminHealth'
import AdminSettings from './admin/AdminSettings'

const NAV_ITEMS = [
  { path: '', label: 'Overview', icon: 'ti-layout-dashboard' },
  { path: 'users', label: 'Users', icon: 'ti-users' },
  { path: 'engineers', label: 'Engineers', icon: 'ti-badge' },
  { path: 'reports', label: 'Reports', icon: 'ti-file-description' },
  { path: 'bookings', label: 'Bookings', icon: 'ti-calendar-event' },
  { path: 'waitlist', label: 'Waitlist', icon: 'ti-mail' },
  { path: 'affiliates', label: 'Products & Affiliates', icon: 'ti-shopping-cart' },
  { path: 'emails', label: 'Emails', icon: 'ti-send' },
  { path: 'health', label: 'System Health', icon: 'ti-activity' },
  { path: 'settings', label: 'Settings', icon: 'ti-settings' },
]

export default function Admin({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // the path is /admin/something
  const currentPath = location.pathname.replace('/admin', '').replace(/^\//, '')
  const currentNav = NAV_ITEMS.find(n => n.path === currentPath) || NAV_ITEMS[0]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050B14', color: '#fff' }}>
      
      {/* Mobile Header (Hamburger) */}
      <div className="admin-mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#0B1F3A', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Solar<span style={{ color: '#F5A623' }}>ah</span></div>
          <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Admin</div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>
          <i className={mobileMenuOpen ? 'ti ti-x' : 'ti ti-menu-2'} />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{
        width: 240, background: '#0B1F3A', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', padding: '1.5rem', flexShrink: 0
      }}>
        {/* Logo (Desktop) */}
        <div className="admin-desktop-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Solar<span style={{ color: '#F5A623' }}>ah</span></div>
          <div style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Admin</div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = currentPath === item.path
            return (
              <button key={item.path} onClick={() => { navigate(`/admin/${item.path}`); setMobileMenuOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: isActive ? 'rgba(245,166,35,0.1)' : 'transparent',
                color: isActive ? '#F5A623' : 'rgba(255,255,255,0.6)',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                textAlign: 'left', transition: 'all 0.2s'
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            <i className="ti ti-arrow-left" /> Back to site
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '2rem', marginTop: 0 }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            Admin <i className="ti ti-chevron-right" style={{ fontSize: 10 }} /> <span style={{ color: '#F5A623' }}>{currentNav.label}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px 0' }}>{currentNav.label}</h1>
        </div>

        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="engineers" element={<AdminEngineers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="waitlist" element={<AdminWaitlist />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="emails" element={<AdminEmails />} />
            <Route path="health" element={<AdminHealth />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </div>

      <style>{`
        .admin-mobile-header { display: none !important; }
        @media(max-width: 900px) {
          .admin-mobile-header { display: flex !important; }
          .admin-desktop-logo { display: none !important; }
          .admin-main { margin-top: 60px !important; padding: 1rem !important; }
          .admin-sidebar { 
            position: fixed; top: 64px; left: 0; bottom: 0;
            transform: translateX(-100%); transition: transform 0.3s ease;
            z-index: 99;
          }
          .admin-sidebar.open { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
