// ── Solarah PDF Report Generator ─────────────────────────────────────────────
// Uses jsPDF to build a branded downloadable report in-browser.

export async function generatePDF(state, specs, products, aiText) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 18, CW = W - 2 * M
  const fmt = n => n?.toLocaleString() ?? '—'
  let y = 0

  // ── Header ──
  doc.setFillColor(11, 31, 58)
  doc.rect(0, 0, W, 44, 'F')
  doc.setFillColor(245, 166, 35)
  doc.rect(0, 0, W, 3, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Solar', M, 24)
  doc.setTextColor(245, 166, 35)
  doc.text('ah', M + doc.getTextWidth('Solar'), 24)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(160, 185, 210)
  doc.text('SYSTEM DESIGN REPORT', M, 32)
  doc.text(`Report ID: SLR-${Date.now().toString(36).toUpperCase()}`, M, 38)

  const name = state.name || 'Homeowner'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(name, W - M, 24, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(160, 185, 210)
  const loc = (state.city ? state.city + ', ' : '') + state.region
  doc.text(loc, W - M, 32, { align: 'right' })
  doc.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 38, { align: 'right' })

  y = 54

  // ── Section helper ──
  const section = (title) => {
    doc.setFillColor(240, 244, 250)
    doc.roundedRect(M, y - 5, CW, 11, 2, 2, 'F')
    doc.setFillColor(245, 166, 35)
    doc.rect(M, y - 5, 3, 11, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(11, 31, 58)
    doc.text(title, M + 7, y + 2.5)
    y += 14
  }

  const row = (label, value, color) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 120, 140)
    doc.text(label, M, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(color || [44, 62, 80]))
    doc.text(String(value), W - M, y, { align: 'right' })
    doc.setDrawColor(220, 228, 238)
    doc.setLineWidth(0.2)
    doc.line(M, y + 2.5, W - M, y + 2.5)
    y += 9
  }

  // ── System overview ──
  section('System overview')
  row('System size',       `${specs.systemKW} kWp — ${specs.panels} × 400W panels`)
  row('Daily load',        `${specs.dailyKWh} kWh/day`)
  row('Peak sun hours',    `${specs.peakSun} hrs/day (${state.region})`)
  row('Inverter',          `${specs.inverterKW} kW Hybrid MPPT`)
  row('Battery storage',   `${specs.batteryKWh} kWh LFP`)
  row('System type',       state.systemType || 'Hybrid (grid-tied + battery backup)')
  y += 4

  // ── Financial summary ──
  section('Financial summary')
  row('Estimated system cost',    `${state.currency} ${fmt(specs.systemCost)}`)
  row('Annual electricity savings', `+ ${state.currency} ${fmt(specs.annualSavings)}`, [39, 174, 96])
  row('Payback period',           `${specs.payback} years`)
  row('25-year lifetime savings', `${state.currency} ${fmt(specs.lifetimeSavings)}`, [245, 166, 35])
  row('CO₂ offset per year',      `${specs.co2PerYear} tonnes`)
  y += 4

  // ── Products ──
  section('Recommended components')
  row('PV Panels',  products.panels.name + ' — ' + products.panels.spec.split('·')[0].trim())
  row('Inverter',   products.inverter.name + ' — ' + products.inverter.spec.split('·')[0].trim())
  row('Battery',    products.battery.name + ' — ' + products.battery.spec.split('·')[0].trim())
  y += 4

  // ── AI analysis ──
  if (aiText && aiText.length > 10) {
    // New page if needed
    if (y > 220) { doc.addPage(); y = 20 }
    section('AI system analysis')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(44, 62, 80)
    const lines = doc.splitTextToSize(aiText, CW)
    doc.text(lines, M, y)
    y += lines.length * 5 + 6
  }

  // ── Next steps ──
  if (y > 240) { doc.addPage(); y = 20 }
  section('Your next steps')
  const steps = [
    '1.  Book a virtual consultation with a Solarah certified engineer to review this design.',
    '2.  Purchase recommended components via Solarah partner links (discounts included).',
    '3.  Schedule installation with a local certified installer coordinated by your engineer.',
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(44, 62, 80)
  steps.forEach(s => { doc.text(s, M, y); y += 8 })

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 228, 238)
    doc.setLineWidth(0.3)
    doc.line(M, 284, W - M, 284)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(150, 160, 175)
    doc.text('Solarah — solarah.com  |  For indicative purposes only.  |  Consult a certified engineer before purchasing.', M, 289)
    doc.text(`Page ${i} of ${pageCount}`, W - M, 289, { align: 'right' })
  }

  doc.save(`Solarah_Report_${name.replace(/\s+/g, '_')}.pdf`)
}
