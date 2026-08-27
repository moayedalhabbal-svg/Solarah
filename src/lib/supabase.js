import { createClient } from '@supabase/supabase-js'

// ── Replace these with your actual Supabase project values ──
// Get them from: https://supabase.com → your project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── AUTH ──────────────────────────────────────────────────────────────────────

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── WAITLIST ──────────────────────────────────────────────────────────────────

export async function joinWaitlist({ name, email, country }) {
  const { data, error } = await supabase
    .from('waitlist')
    .insert([{ name, email, country, joined_at: new Date().toISOString() }])
    .select()
  return { data, error }
}

export async function getWaitlistCount() {
  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
  return { count, error }
}

// ── REPORTS ───────────────────────────────────────────────────────────────────

export async function saveReport(userId, reportData) {
  const { data, error } = await supabase
    .from('reports')
    .insert([{
      user_id: userId,
      region: reportData.region,
      city: reportData.city,
      system_kw: reportData.systemKW,
      panel_count: reportData.panels,
      inverter_kw: reportData.invKW,
      battery_kwh: reportData.batKWh,
      system_cost: reportData.cost,
      annual_savings: reportData.annSave,
      payback_years: reportData.payback,
      lifetime_savings: reportData.lifetime,
      co2_tonnes: reportData.co2,
      currency: reportData.currency,
      ai_analysis: reportData.aiText,
      daily_kwh: reportData.dailyKWh,
      created_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export async function getUserReports(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ── ENGINEERS ─────────────────────────────────────────────────────────────────

export async function getEngineers() {
  const { data, error } = await supabase
    .from('engineers')
    .select('*')
    .eq('active', true)
    .order('rating', { ascending: false })
  return { data, error }
}

export async function getEngineerSlots(engineerId, date) {
  const { data, error } = await supabase
    .from('engineer_slots')
    .select('*')
    .eq('engineer_id', engineerId)
    .eq('date', date)
    .eq('booked', false)
  return { data, error }
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────

export async function createBooking({ userId, engineerId, reportId, date, time, notes }) {
  // Mark slot as booked
  await supabase
    .from('engineer_slots')
    .update({ booked: true })
    .eq('engineer_id', engineerId)
    .eq('date', date)
    .eq('time', time)

  // Create the booking record
  const ref = 'SLR-' + Date.now().toString(36).toUpperCase()
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      user_id: userId,
      engineer_id: engineerId,
      report_id: reportId,
      date,
      time,
      notes,
      status: 'confirmed',
      booking_ref: ref,
      created_at: new Date().toISOString()
    }])
    .select()
  return { data, error }
}

export async function getUserBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, engineers(name, role, avatar_initials)`)
    .eq('user_id', userId)
    .order('date', { ascending: true })
  return { data, error }
}

// ── AFFILIATE / PRODUCTS ──────────────────────────────────────────────────────

export async function logAffiliateClick({ userId, productId, productName, supplier }) {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .insert([{
      user_id: userId || null,
      product_id: productId,
      product_name: productName,
      supplier,
      clicked_at: new Date().toISOString()
    }])
  return { data, error }
}

export async function getAffiliateStats(userId) {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('user_id', userId)
    .order('clicked_at', { ascending: false })
  return { data, error }
}
