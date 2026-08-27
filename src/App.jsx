import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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
import { supabase, signOut } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
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
        <Route path="/dashboard"   element={<Dashboard user={user} />} />
        <Route path="/sun-path"    element={<SunPath />} />
      </Routes>
      <Footer />
      <Sunora />
    </>
  )
}

