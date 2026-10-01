import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAdminCheck } from './lib/useAdminCheck'
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    
    // Log to Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('error_logs').insert([{
        user_id: user?.id || null,
        error_type: error.name || 'ReactError',
        message: `${error.message} [${window.location.pathname}]\n\n${errorInfo.componentStack}`
      }]).then(() => {})
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
          <h2 style={{ color: '#EF4444' }}>Something went wrong.</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '1rem 0 2rem' }}>
            An unexpected error occurred. Our engineering team has been notified automatically.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Auth guard: requires login, redirects to /login if not ────────────
function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAdminCheck()
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
      setUserLoading(false)
    })
  }, [])

  if (loading || userLoading) {
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

  if (!user) return <Navigate to="/login" replace state={{ returnUrl: '/admin' }} />
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16, color: '#fff' }}>Access Denied</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>You do not have permission to view this page.</p>
        <button className="btn-primary" onClick={() => window.location.href = '/'}>Return Home</button>
      </div>
    )
  }

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
    <ErrorBoundary>
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
        <Route path="/admin/*" element={
          <RequireAdmin>
            <Admin user={user} />
          </RequireAdmin>
        } />
      </Routes>
      <Footer />
      <Sunora />
    </ErrorBoundary>
  )
}
