import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Sunora from './components/Sunora'
import Landing from './pages/Landing'
import Calculator from './pages/Calculator'
import Engineers from './pages/Engineers'
import Products from './pages/Products'
import Auth from './pages/Auth'
import Waitlist from './pages/Waitlist'
import Dashboard from './pages/Dashboard'
import SunPath from './pages/SunPath'
import SystemDesign from './pages/SystemDesign'
import Admin from './pages/Admin'
import { supabase, signOut, getUserProfile } from './lib/supabase'

// ── Auth guard: requires login, redirects to /login if not ────────────
function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ── Admin guard: requires admin role ──────────────────────────────────
function RequireAdmin({ user, profile, children }) {
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// ── Save report banner for unauthenticated users ──────────────────────
function SaveBanner({ user }) {
  if (user) return null
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(245,166,35,0.15)', border: '0.5px solid rgba(245,166,35,0.3)',
      borderRadius: 10, padding: '8px 20px', zIndex: 900,
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#F5A623',
      backdropFilter: 'blur(12px)', whiteSpace: 'nowrap',
    }}>
      <i className="ti ti-bookmark" aria-hidden="true" />
      <a href="/login" style={{ color: '#F5A623', fontWeight: 600, textDecoration: 'underline' }}>Sign in</a> to save this report
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Check existing session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
      if (data?.user) {
        getUserProfile(data.user.id).then(({ data: p }) => setProfile(p))
      }
      setAuthLoading(false)
    })
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null
      setUser(u)
      if (u) {
        getUserProfile(u.id).then(({ data: p }) => setProfile(p))
      } else {
        setProfile(null)
      }
      setAuthLoading(false)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
  }

  // Show loading spinner while checking session — prevents flash of unauthenticated content
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#F5A623', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Navbar user={user} onSignOut={handleSignOut} />
      <Routes>
        <Route path="/"            element={<Landing />} />
        <Route path="/calculator"  element={<Calculator user={user} />} />
        <Route path="/engineers"   element={<Engineers user={user} />} />
        <Route path="/products"    element={<Products user={user} />} />
        <Route path="/login"       element={<Auth onAuth={setUser} />} />
        <Route path="/waitlist"    element={<Waitlist />} />
        <Route path="/dashboard"   element={
          <RequireAuth user={user}>
            <Dashboard user={user} />
          </RequireAuth>
        } />
        <Route path="/sun-path"    element={<SunPath />} />
        <Route path="/system-design" element={
          <>
            <SystemDesign />
            {location.pathname === '/system-design' && <SaveBanner user={user} />}
          </>
        } />
        <Route path="/admin" element={
          <RequireAdmin user={user} profile={profile}>
            <Admin user={user} />
          </RequireAdmin>
        } />
      </Routes>
      <Footer />
      <Sunora />
    </>
  )
}
