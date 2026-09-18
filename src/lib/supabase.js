import { createClient } from '@supabase/supabase-js'

// ── Replace these with your actual Supabase project values ──
// Get them from: https://supabase.com → your project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── SEND EMAIL (via Edge Function) ───────────────────────────────────────────
// Fire-and-forget — we don't want email failures to block the UI
async function sendEmail(type, to, data, engineerEmail = null) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, to, data, engineerEmail })
    })
  } catch (err) {
    console.warn('Email send failed (non-blocking):', err)
  }
}

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

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' }
  })
  return { data, error }
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login'
  })
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

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// ── WAITLIST ──────────────────────────────────────────────────────────────────

export async function joinWaitlist({ name, email, country }) {
  const { data, error } = await supabase
    .from('waitlist')
    .insert([{ name, email, country, joined_at: new Date().toISOString() }])
    .select()

  // Send welcome email (fire-and-forget)
  if (!error && data?.[0]) {
    const { count } = await getWaitlistCount()
    sendEmail('waitlist_welcome', email, { name, position: count || 1 })
  }

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
      sector: reportData.sector || 'residential',
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

  // Send "report saved" email for user's first report (fire-and-forget)
  if (!error && data?.[0]) {
    const { count } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count === 1) {
      const user = await getUser()
      const email = user?.email
      const name = user?.user_metadata?.full_name || 'there'
      if (email) {
        sendEmail('report_saved', email, {
          name,
          systemKW: reportData.systemKW,
          batteryKWh: reportData.batKWh,
          cost: reportData.cost,
          payback: reportData.payback,
          currency: reportData.currency || 'USD',
        })
      }
    }
  }

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

export async function createBooking({ userId, engineerId, reportId, date, time, notes, engineerName, engineerRole, engineerEmail, userEmail, userName, systemSpecs }) {
  // Mark slot as booked — check for errors to prevent double-booking
  const { error: slotError } = await supabase
    .from('engineer_slots')
    .update({ booked: true })
    .eq('engineer_id', engineerId)
    .eq('date', date)
    .eq('time', time)
    .eq('booked', false)  // Only update if not already booked

  if (slotError) return { data: null, error: slotError }

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

  // Send booking emails (fire-and-forget)
  if (!error && data?.[0]) {
    const bookingData = {
      userName: userName || 'Client',
      engineerName: engineerName || 'Engineer',
      engineerRole: engineerRole || '',
      date, time, bookingRef: ref,
      systemKW: systemSpecs?.systemKW || 0,
      panels: systemSpecs?.panels || 0,
      batteryKWh: systemSpecs?.batteryKWh || 0,
      notes: notes || '',
    }
    // Email to user
    if (userEmail) {
      sendEmail('booking_confirmation', userEmail, bookingData, engineerEmail)
    }
  }

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

// ── ADMIN QUERIES ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [waitlist, reports, bookings, clicks] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*'),
    supabase.from('bookings').select('*'),
    supabase.from('affiliate_clicks').select('*'),
  ])
  return {
    waitlistCount: waitlist.count || 0,
    reports: reports.data || [],
    bookings: bookings.data || [],
    clicks: clicks.data || [],
  }
}

export async function getAdminWaitlistByDay() {
  const { data, error } = await supabase
    .from('waitlist')
    .select('joined_at')
    .gte('joined_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('joined_at', { ascending: true })
  return { data, error }
}

export async function getAdminEngineers() {
  const { data, error } = await supabase
    .from('engineers')
    .select('*')
    .order('name')
  return { data, error }
}

export async function toggleEngineerActive(engineerId, active) {
  const { data, error } = await supabase
    .from('engineers')
    .update({ active })
    .eq('id', engineerId)
  return { data, error }
}
