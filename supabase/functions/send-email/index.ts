// ════════════════════════════════════════════════════════════════════════
// SOLARAH — Email Notification Service (Supabase Edge Function)
// ════════════════════════════════════════════════════════════════════════
// Sends transactional emails via Resend. Handles 4 email types:
//   1. waitlist_welcome   — when someone joins the waitlist
//   2. booking_confirmation — sent to user after booking
//   3. booking_engineer_notify — sent to engineer after booking
//   4. report_saved       — when user saves their first report
// ════════════════════════════════════════════════════════════════════════

import {
  clientIp,
  corsHeaders,
  enforceRateLimits,
  isAllowedOrigin,
  jsonResponse,
} from '../_shared/security.ts'

const RESEND_URL = 'https://api.resend.com/emails'
const EMAIL_TYPES = new Set([
  'waitlist_welcome',
  'booking_confirmation',
  'booking_engineer_notify',
  'report_saved',
])

// Using Resend default sender (no custom domain)
const FROM_EMAIL = 'Solarah <onboarding@resend.dev>'

// ── Brand colors ───────────────────────────────────────────────────────
const NAVY = '#0B1F3A'
const AMBER = '#F5A623'
const WHITE = '#FFFFFF'
const GRAY = '#94A3B8'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maxLength
    && !/[\u0000-\u001f\u007f]/.test(value)
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key))
}

function validateData(type: string, value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Record<string, unknown>

  if (type === 'waitlist_welcome') {
    return hasOnlyKeys(data, ['name', 'position'])
      && isText(data.name, 100)
      && typeof data.position === 'number'
      && Number.isInteger(data.position)
      && data.position > 0
  }
  if (type === 'booking_confirmation') {
    return hasOnlyKeys(data, [
      'userName', 'engineerName', 'engineerRole', 'date', 'time', 'bookingRef',
      'systemKW', 'panels', 'batteryKWh', 'notes',
    ])
      && isText(data.userName, 100)
      && isText(data.engineerName, 100)
      && (data.engineerRole === '' || isText(data.engineerRole, 120))
      && typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      && typeof data.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.time)
      && isText(data.bookingRef, 40)
      && isFiniteNonNegative(data.systemKW)
      && typeof data.panels === 'number' && Number.isInteger(data.panels) && data.panels >= 0
      && isFiniteNonNegative(data.batteryKWh)
      && (data.notes === '' || (typeof data.notes === 'string' && data.notes.length <= 2000))
  }
  if (type === 'booking_engineer_notify') {
    return hasOnlyKeys(data, [
      'engineerName', 'userName', 'date', 'time', 'systemKW', 'panels',
      'batteryKWh', 'notes',
    ])
      && isText(data.engineerName, 100)
      && isText(data.userName, 100)
      && typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      && typeof data.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(data.time)
      && isFiniteNonNegative(data.systemKW)
      && typeof data.panels === 'number' && Number.isInteger(data.panels) && data.panels >= 0
      && isFiniteNonNegative(data.batteryKWh)
      && (data.notes === '' || (typeof data.notes === 'string' && data.notes.length <= 2000))
  }
  if (type === 'report_saved') {
    return hasOnlyKeys(data, ['name', 'systemKW', 'batteryKWh', 'cost', 'payback', 'currency'])
      && isText(data.name, 100)
      && isFiniteNonNegative(data.systemKW)
      && isFiniteNonNegative(data.batteryKWh)
      && isFiniteNonNegative(data.cost)
      && (data.payback === null || isFiniteNonNegative(data.payback))
      && data.currency === 'USD'
  }
  return false
}

async function authenticatedUser(req: Request): Promise<{ id: string; email: string; admin: boolean } | null> {
  const authorization = req.headers.get('authorization') || ''
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) throw new Error('Supabase auth configuration is unavailable')

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  })
  if (!response.ok) return null
  const user = await response.json()
  if (typeof user?.id !== 'string' || !isEmail(user.email)) return null

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey) throw new Error('Supabase service-role configuration is unavailable')
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(user.id)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )
  if (!profileResponse.ok) throw new Error('Could not verify user role')
  const profiles = await profileResponse.json()
  return { id: user.id, email: user.email, admin: profiles[0]?.role === 'admin' }
}

// ── Shared email wrapper ───────────────────────────────────────────────
function emailWrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:${NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:22px;font-weight:700;color:${WHITE};">Solar</span><span style="font-size:22px;font-weight:700;color:${AMBER};">ah</span>
          <span style="float:right;font-size:11px;color:${GRAY};margin-top:8px;">${title}</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:${WHITE};font-size:14px;line-height:1.7;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <span style="font-size:11px;color:${GRAY};">© ${new Date().getFullYear()} Solarah — Your solar system, designed for you.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Email templates ────────────────────────────────────────────────────

function waitlistWelcome(data: { name: string; position: number }): { subject: string; html: string } {
  return {
    subject: "You're on the Solarah waitlist ☀️",
    html: emailWrap('Waitlist Confirmation', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Welcome, ${escapeHtml(data.name)}!</p>
      <p>You're <strong style="color:${AMBER};">#${data.position}</strong> on the Solarah waitlist.</p>
      <p>Here's what's coming:</p>
      <ul style="padding-left:20px;color:rgba(255,255,255,0.8);">
        <li>Free AI-powered solar system design for your home or business</li>
        <li>Downloadable PDF engineering reports</li>
        <li>Access to certified solar engineers for virtual consultations</li>
        <li>Smart product recommendations with transparent pricing</li>
      </ul>
      <p>We'll send you early access as soon as Solarah launches. No spam — ever.</p>
      <p style="color:${GRAY};font-size:12px;margin-top:24px;">You received this email because you joined the Solarah waitlist.</p>
    `)
  }
}

function bookingConfirmation(data: {
  userName: string; engineerName: string; date: string; time: string;
  bookingRef: string; engineerRole: string;
}): { subject: string; html: string; icsAttachment: string } {
  const dtStart = data.date.replace(/-/g, '') + 'T' + data.time.replace(':', '') + '00'
  const hr = parseInt(data.time.split(':')[0]) + 1
  const dtEnd = data.date.replace(/-/g, '') + 'T' + String(hr).padStart(2, '0') + data.time.split(':')[1] + '00'

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Solarah//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:Solarah Consultation - ${data.engineerName}`,
    `DESCRIPTION:Solar system design review with ${data.engineerName} (${data.engineerRole}). Booking ref: ${data.bookingRef}`,
    'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n')

  return {
    subject: `Booking confirmed - ${data.engineerName} on ${data.date}`,
    html: emailWrap('Booking Confirmation', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Booking confirmed!</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:120px;">Engineer</td><td style="color:${WHITE};font-weight:600;">${escapeHtml(data.engineerName)}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Date & Time</td><td style="color:${WHITE};">${escapeHtml(data.date)} at ${escapeHtml(data.time)}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Format</td><td style="color:${WHITE};">Video call · 45 minutes</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Booking Ref</td><td style="color:${AMBER};font-weight:600;font-family:monospace;">${escapeHtml(data.bookingRef)}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Fee</td><td style="color:#27AE60;font-weight:600;">Free with Solarah report</td></tr>
      </table>
      <p>Your engineer has received your Solarah system report and will review it before the call.</p>
      <p style="color:${GRAY};font-size:12px;">A calendar invite (.ics) is attached to this email.</p>
    `),
    icsAttachment: ics
  }
}

function bookingEngineerNotify(data: {
  engineerName: string; userName: string; date: string; time: string;
  systemKW: number; panels: number; batteryKWh: number; notes: string;
}): { subject: string; html: string } {
  return {
    subject: `New booking: ${data.userName} - ${data.date} at ${data.time}`,
    html: emailWrap('New Booking', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Hi ${escapeHtml(data.engineerName)},</p>
      <p>You have a new consultation booking on Solarah:</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:120px;">Client</td><td style="color:${WHITE};font-weight:600;">${escapeHtml(data.userName)}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Date & Time</td><td style="color:${WHITE};">${escapeHtml(data.date)} at ${escapeHtml(data.time)}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">System</td><td style="color:${WHITE};">${data.systemKW} kWp · ${data.panels} panels · ${data.batteryKWh} kWh battery</td></tr>
        ${data.notes ? `<tr><td style="color:${GRAY};font-size:12px;">Client notes</td><td style="color:rgba(255,255,255,0.8);font-style:italic;">"${escapeHtml(data.notes)}"</td></tr>` : ''}
      </table>
      <p>The client's full Solarah report is available in your dashboard.</p>
    `)
  }
}

function reportSaved(data: {
  name: string; systemKW: number; batteryKWh: number;
  cost: number; payback: number | null; currency: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${data.systemKW} kWp solar design is saved`,
    html: emailWrap('Report Saved', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Great news, ${escapeHtml(data.name)}!</p>
      <p>Your solar system design has been saved to your Solarah account.</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:140px;">System Size</td><td style="color:${WHITE};font-weight:600;">${data.systemKW} kWp</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Battery</td><td style="color:${WHITE};">${data.batteryKWh} kWh</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Estimated Cost</td><td style="color:${WHITE};">${data.currency} ${data.cost.toLocaleString()}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Payback Period</td><td style="color:#27AE60;font-weight:600;">${data.payback == null ? 'Not recovered within 25 years at current assumptions' : `${data.payback} years`}</td></tr>
      </table>
      <p><strong>Next step:</strong> Book a free virtual consultation with a certified Solarah engineer to confirm your design before placing any orders.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${AMBER};border-radius:8px;padding:12px 28px;">
        <a href="https://solarah.com/engineers" style="color:${NAVY};font-weight:700;text-decoration:none;font-size:14px;">Book an engineer →</a>
      </td></tr></table>
    `)
  }
}

// ── Main handler ───────────────────────────────────────────────────────

async function waitlistEntryExists(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase service configuration is unavailable')
  const url = new URL(`${supabaseUrl}/rest/v1/waitlist`)
  url.searchParams.set('select', 'id')
  url.searchParams.set('email', `eq.${email}`)
  const response = await fetch(url, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  })
  if (!response.ok) throw new Error('Could not verify waitlist recipient')
  const rows = await response.json()
  return Array.isArray(rows) && rows.length === 1
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  if (!isAllowedOrigin(origin)) return new Response('Forbidden', { status: 403 })

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin)
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Request body must be an object' }, 400, origin)
    }
    const request = body as Record<string, unknown>
    if (!hasOnlyKeys(request, ['type', 'to', 'data'])
      || typeof request.type !== 'string'
      || !EMAIL_TYPES.has(request.type)
      || !isEmail(request.to)
      || !validateData(request.type, request.data)) {
      return jsonResponse({ error: 'Invalid email request' }, 400, origin)
    }

    const { type, to, data } = request as {
      type: string
      to: string
      data: Record<string, any>
    }
    let principal: { id: string; email: string; admin: boolean } | null = null
    if (type !== 'waitlist_welcome') {
      principal = await authenticatedUser(req)
      if (!principal) return jsonResponse({ error: 'Authentication required' }, 401, origin)
      if (type === 'booking_engineer_notify' && !principal.admin) {
        return jsonResponse({ error: 'Administrator access required' }, 403, origin)
      }
      if (type !== 'booking_engineer_notify'
        && to.toLowerCase() !== principal.email.toLowerCase()) {
        return jsonResponse({ error: 'Recipient must match the authenticated account' }, 403, origin)
      }
    } else if (!await waitlistEntryExists(to)) {
      return jsonResponse({ error: 'Recipient is not registered on the waitlist' }, 403, origin)
    }

    const rateLimit = await enforceRateLimits([
      { scope: 'send-email:ip-minute', subject: clientIp(req), windowSeconds: 60, limit: 10 },
      { scope: 'send-email:ip-day', subject: clientIp(req), windowSeconds: 86400, limit: 100 },
      { scope: 'send-email:recipient-minute', subject: to.toLowerCase(), windowSeconds: 60, limit: 5 },
      { scope: 'send-email:recipient-day', subject: to.toLowerCase(), windowSeconds: 86400, limit: 20 },
    ])
    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: 'Email rate limit exceeded. Please retry later.' },
        429,
        origin,
        { 'Retry-After': String(rateLimit.retryAfter) },
      )
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      console.error('RESEND_API_KEY is not configured')
      return jsonResponse({ error: 'Email service is not configured' }, 500, origin)
    }

    // Build the email based on type
    let subject = ''
    let html = ''
    let icsAttachment: string | null = null
    const emailsToSend: Array<{ to: string; subject: string; html: string; attachments?: unknown[] }> = []

    switch (type) {
      case 'waitlist_welcome': {
        const email = waitlistWelcome(data)
        emailsToSend.push({ to, subject: email.subject, html: email.html })
        break
      }
      case 'booking_confirmation': {
        const userEmail = bookingConfirmation(data)
        emailsToSend.push({
          to,
          subject: userEmail.subject,
          html: userEmail.html,
          attachments: [{
            filename: 'solarah-booking.ics',
            content: btoa(userEmail.icsAttachment),
            type: 'text/calendar',
          }]
        })
        break
      }
      case 'booking_engineer_notify': {
        const email = bookingEngineerNotify(data)
        emailsToSend.push({ to, subject: email.subject, html: email.html })
        break
      }
      case 'report_saved': {
        const email = reportSaved(data)
        emailsToSend.push({ to, subject: email.subject, html: email.html })
        break
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${type}` }),
          { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
        )
    }

    // Send all emails
    const results = []
    for (const email of emailsToSend) {
      const resendBody: Record<string, unknown> = {
        from: FROM_EMAIL,
        to: email.to,
        subject: email.subject,
        html: email.html,
      }
      if (email.attachments) {
        resendBody.attachments = email.attachments
      }

      const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify(resendBody),
      })

      const result = await res.json()
      results.push({ to: email.to, status: res.status, id: result.id || null })

      if (!res.ok) {
        console.error('Resend request failed with status:', res.status)
        return jsonResponse({ error: 'Email delivery failed' }, 502, origin)
      }
    }

    return new Response(
      JSON.stringify({ success: true, emails: results }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Send-email request failed:', err instanceof Error ? err.name : 'UnknownError')
    return jsonResponse({ error: 'Email service request failed' }, 500, origin)
  }
})
