// ════════════════════════════════════════════════════════════════════════
// SOLARAH — Email Notification Service (Supabase Edge Function)
// ════════════════════════════════════════════════════════════════════════
// Sends transactional emails via Resend. Handles 4 email types:
//   1. waitlist_welcome   — when someone joins the waitlist
//   2. booking_confirmation — sent to user after booking
//   3. booking_engineer_notify — sent to engineer after booking
//   4. report_saved       — when user saves their first report
// ════════════════════════════════════════════════════════════════════════

const RESEND_URL = 'https://api.resend.com/emails'

// Using Resend default sender (no custom domain)
const FROM_EMAIL = 'Solarah <onboarding@resend.dev>'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]

function corsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// ── Brand colors ───────────────────────────────────────────────────────
const NAVY = '#0B1F3A'
const AMBER = '#F5A623'
const WHITE = '#FFFFFF'
const GRAY = '#94A3B8'

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
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Welcome, ${data.name}!</p>
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
    `SUMMARY:Solarah Consultation — ${data.engineerName}`,
    `DESCRIPTION:Solar system design review with ${data.engineerName} (${data.engineerRole}). Booking ref: ${data.bookingRef}`,
    'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n')

  return {
    subject: `Booking confirmed — ${data.engineerName} on ${data.date} ✅`,
    html: emailWrap('Booking Confirmation', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Booking confirmed!</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:120px;">Engineer</td><td style="color:${WHITE};font-weight:600;">${data.engineerName}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Date & Time</td><td style="color:${WHITE};">${data.date} at ${data.time}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Format</td><td style="color:${WHITE};">Video call · 45 minutes</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Booking Ref</td><td style="color:${AMBER};font-weight:600;font-family:monospace;">${data.bookingRef}</td></tr>
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
    subject: `New booking: ${data.userName} — ${data.date} at ${data.time}`,
    html: emailWrap('New Booking', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Hi ${data.engineerName},</p>
      <p>You have a new consultation booking on Solarah:</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:120px;">Client</td><td style="color:${WHITE};font-weight:600;">${data.userName}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Date & Time</td><td style="color:${WHITE};">${data.date} at ${data.time}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">System</td><td style="color:${WHITE};">${data.systemKW} kWp · ${data.panels} panels · ${data.batteryKWh} kWh battery</td></tr>
        ${data.notes ? `<tr><td style="color:${GRAY};font-size:12px;">Client notes</td><td style="color:rgba(255,255,255,0.8);font-style:italic;">"${data.notes}"</td></tr>` : ''}
      </table>
      <p>The client's full Solarah report is available in your dashboard.</p>
    `)
  }
}

function reportSaved(data: {
  name: string; systemKW: number; batteryKWh: number;
  cost: number; payback: number; currency: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${data.systemKW} kWp solar design is saved ☀️`,
    html: emailWrap('Report Saved', `
      <p style="font-size:18px;font-weight:600;color:${AMBER};margin:0 0 16px;">Great news, ${data.name}!</p>
      <p>Your solar system design has been saved to your Solarah account.</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="margin:16px 0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
        <tr><td style="color:${GRAY};font-size:12px;width:140px;">System Size</td><td style="color:${WHITE};font-weight:600;">${data.systemKW} kWp</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Battery</td><td style="color:${WHITE};">${data.batteryKWh} kWh</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Estimated Cost</td><td style="color:${WHITE};">${data.currency} ${data.cost.toLocaleString()}</td></tr>
        <tr><td style="color:${GRAY};font-size:12px;">Payback Period</td><td style="color:#27AE60;font-weight:600;">${data.payback} years</td></tr>
      </table>
      <p><strong>Next step:</strong> Book a free virtual consultation with a certified Solarah engineer to confirm your design before placing any orders.</p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:${AMBER};border-radius:8px;padding:12px 28px;">
        <a href="https://solarah.com/engineers" style="color:${NAVY};font-weight:700;text-decoration:none;font-size:14px;">Book an engineer →</a>
      </td></tr></table>
    `)
  }
}

// ── Main handler ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY not configured. Run: supabase secrets set RESEND_API_KEY=your-key' }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { type, to, data, engineerEmail } = await req.json()

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing "type" or "to" field' }),
        { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
      )
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
        // Also notify the engineer
        if (engineerEmail) {
          const engEmail = bookingEngineerNotify(data)
          emailsToSend.push({ to: engineerEmail, subject: engEmail.subject, html: engEmail.html })
        }
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
        console.error('Resend error:', result)
      }
    }

    return new Response(
      JSON.stringify({ success: true, emails: results }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Send-email error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
