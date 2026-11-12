// ══════════════════════════════════════════════════════════════════════════════
// SOLARAH — Professional Multi-Page PDF Report Generator
// Uses jsPDF only. All charts/diagrams drawn with built-in drawing methods.
// ══════════════════════════════════════════════════════════════════════════════
import { computeDesignForConsumer } from './designConsumers.js'
import { formatPayback } from './calculator.js'

// ── Brand constants ──────────────────────────────────────────────────────────
const NAVY   = [11, 31, 58]
const AMBER  = [245, 166, 35]
const GREEN  = [39, 174, 96]
const WHITE  = [255, 255, 255]
const LGRAY  = [247, 249, 252]
const DGRAY  = [100, 120, 140]
const MGRAY  = [180, 190, 200]
const BGRAY  = [220, 228, 238]
const W = 210, H = 297, M = 18, CW = W - 2 * M

// ── Utilities ────────────────────────────────────────────────────────────────
const fmt = n => n != null ? Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'
const fmtD = (n, d=1) => n != null ? Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—'
const reportId = () => 'SLR-' + Date.now().toString(36).toUpperCase()
const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// ── Drawing helpers ──────────────────────────────────────────────────────────
function drawWatermark(doc) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(50)
  doc.setTextColor(244, 244, 244)
  doc.saveGraphicsState()
  const cx = W / 2, cy = H / 2
  // Diagonal text approximation — jsPDF doesn't support rotation natively on text,
  // so we draw it as very light centered text
  doc.text('SOLARAH', cx, cy, { align: 'center', baseline: 'middle' })
  doc.restoreGraphicsState()
}

function drawPageHeader(doc, title, rid) {
  // Amber rule
  doc.setDrawColor(...AMBER)
  doc.setLineWidth(0.3)
  doc.line(M, 16, W - M, 16)
  // Logo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text('Solar', M, 12)
  const sw = doc.getTextWidth('Solar')
  doc.setTextColor(...AMBER)
  doc.text('ah', M + sw, 12)
  // Title centered
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...NAVY)
  doc.text(title, W / 2, 12, { align: 'center' })
  // Report ID right
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...MGRAY)
  doc.text(rid, W - M, 12, { align: 'right' })
}

function drawPageFooter(doc, pageNum, totalPages, dateStr) {
  // Gray rule
  doc.setDrawColor(...BGRAY)
  doc.setLineWidth(0.3)
  doc.line(M, 284, W - M, 284)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 160, 175)
  doc.text('solarah.com — For indicative purposes only', M, 289)
  doc.text(`Page ${pageNum} of ${totalPages}`, W / 2, 289, { align: 'center' })
  doc.text(dateStr, W - M, 289, { align: 'right' })
}

function drawSection(doc, title, y, subtitle) {
  doc.setFillColor(...LGRAY)
  doc.roundedRect(M, y - 5, CW, subtitle ? 15 : 11, 2, 2, 'F')
  doc.setFillColor(...AMBER)
  doc.rect(M, y - 5, 2.5, subtitle ? 15 : 11, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text(title, M + 7, y + 2)
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...DGRAY)
    doc.text(subtitle, M + 7, y + 8)
  }
  return y + (subtitle ? 20 : 14)
}

function drawTableRow(doc, y, cols, values, opts = {}) {
  const { header, bg, colWidths, align } = opts
  const rowH = 8
  // Background
  if (bg) {
    doc.setFillColor(...bg)
    doc.rect(M, y - 5.5, CW, rowH, 'F')
  }
  // Cell borders
  doc.setDrawColor(...BGRAY)
  doc.setLineWidth(0.15)
  let x = M
  for (let i = 0; i < cols; i++) {
    const cw = colWidths ? colWidths[i] : CW / cols
    doc.rect(x, y - 5.5, cw, rowH)
    x += cw
  }
  // Text
  if (header) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...WHITE)
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...NAVY)
  }
  x = M
  for (let i = 0; i < values.length; i++) {
    const cw = colWidths ? colWidths[i] : CW / cols
    const a = align?.[i] || 'left'
    const tx = a === 'right' ? x + cw - 3 : x + 3
    doc.text(String(values[i] ?? ''), tx, y - 0.5, { align: a === 'right' ? 'right' : 'left' })
    x += cw
  }
  return y + rowH
}

function drawKpiBox(doc, x, y, w, h, value, unit, label) {
  // Navy background
  doc.setFillColor(...NAVY)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
  // Amber top border
  doc.setFillColor(...AMBER)
  doc.rect(x, y, w, 2, 'F')
  // Value
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  const valueText = String(value)
  const compactValue = doc.getTextWidth(valueText) > w - 8
  doc.setFontSize(compactValue ? 7 : 18)
  doc.setTextColor(...WHITE)
  doc.text(compactValue ? doc.splitTextToSize(valueText, w - 8) : valueText, x + w / 2, y + (compactValue ? 11 : 16), { align: 'center' })
  // Unit
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...AMBER)
  doc.text(unit, x + w / 2, y + 23, { align: 'center' })
  // Label
  doc.setFontSize(7)
  doc.setTextColor(...MGRAY)
  doc.text(label, x + w / 2, y + h - 4, { align: 'center' })
}

function drawCalloutBox(doc, y, text, opts = {}) {
  const { borderColor = AMBER, title } = opts
  const lines = doc.splitTextToSize(text, CW - 14)
  const boxH = (title ? 7 : 0) + lines.length * 4.5 + 8
  doc.setFillColor(255, 252, 245)
  doc.roundedRect(M, y, CW, boxH, 2, 2, 'F')
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.rect(M, y, CW, boxH)
  doc.setFillColor(...borderColor)
  doc.rect(M, y, 3, boxH, 'F')
  let ty = y + 6
  if (title) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...borderColor)
    doc.text(title, M + 8, ty)
    ty += 7
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DGRAY)
  lines.forEach(l => { doc.text(l, M + 8, ty); ty += 4.5 })
  return y + boxH + 4
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER
// ══════════════════════════════════════════════════════════════════════════════
function drawCoverPage(doc, state, specs, rid, dateStr, isBeginner) {
  // Top navy band — 45% of page
  const bandH = H * 0.42
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, bandH, 'F')

  // Sun graphic — concentric glow circles
  const sunX = W - 48, sunY = 52, sunR = 18
  // Glow rings
  doc.setFillColor(245, 166, 35)  // won't show opacity but gives a subtle fill
  doc.circle(sunX, sunY, sunR + 12, 'F') // outermost glow - will be covered
  doc.setFillColor(20, 40, 68)  // slightly lighter than navy to simulate glow
  doc.circle(sunX, sunY, sunR + 12, 'F')
  doc.setFillColor(30, 50, 78)
  doc.circle(sunX, sunY, sunR + 8, 'F')
  doc.setFillColor(40, 60, 88)
  doc.circle(sunX, sunY, sunR + 4, 'F')
  // Sun circle
  doc.setFillColor(...AMBER)
  doc.circle(sunX, sunY, sunR, 'F')
  // Sun rays
  doc.setDrawColor(...AMBER)
  doc.setLineWidth(0.8)
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45) * Math.PI / 180
    const x1 = sunX + Math.cos(angle) * (sunR + 3)
    const y1 = sunY + Math.sin(angle) * (sunR + 3)
    const x2 = sunX + Math.cos(angle) * (sunR + 11)
    const y2 = sunY + Math.sin(angle) * (sunR + 11)
    doc.line(x1, y1, x2, y2)
  }

  // Wordmark
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(...WHITE)
  doc.text('Solar', M + 4, 50)
  const sw = doc.getTextWidth('Solar')
  doc.setTextColor(...AMBER)
  doc.text('ah', M + 4 + sw, 50)

  // Subtitle with letter spacing
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(160, 185, 210)
  const subtitle = 'SYSTEM DESIGN REPORT'
  let sx = M + 4
  subtitle.split('').forEach(ch => {
    doc.text(ch, sx, 62)
    sx += doc.getTextWidth(ch) + 0.8
  })

  // Beginner badge
  if (isBeginner) {
    doc.setFillColor(...GREEN)
    doc.roundedRect(M + 4, 68, 42, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text('BEGINNER GUIDE', M + 8, 73.5)
  }

  // Middle band — customer info
  const midY = bandH + 8
  // Amber left border
  doc.setFillColor(...AMBER)
  doc.rect(M, midY, 3, 40, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...AMBER)
  doc.text(`Report ID: ${rid}`, M + 10, midY + 8)

  const name = state.name || 'Homeowner'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...NAVY)
  doc.text(name, M + 10, midY + 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...DGRAY)
  const loc = (state.city ? state.city + ', ' : '') + (state.region || '')
  doc.text(loc, M + 10, midY + 28)

  doc.setFontSize(9)
  doc.setTextColor(...MGRAY)
  doc.text(dateStr, M + 10, midY + 35)

  // Bottom info boxes
  const boxY = midY + 52
  const boxW = CW / 4 - 3
  const boxes = [
    { val: `${specs.systemKW} kWp`, label: 'System capacity' },
    { val: specs.sector === 'industrial' ? 'Industrial' : specs.sector === 'commercial' ? 'Commercial' : 'Residential', label: 'Project type' },
    { val: state.systemType || 'Hybrid', label: 'Configuration' },
    { val: 'USD', label: 'Currency' },
  ]
  boxes.forEach((b, i) => {
    const bx = M + i * (boxW + 4)
    doc.setFillColor(...LGRAY)
    doc.roundedRect(bx, boxY, boxW, 28, 2, 2, 'F')
    doc.setFillColor(...AMBER)
    doc.rect(bx, boxY, boxW, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...NAVY)
    doc.text(b.val, bx + boxW / 2, boxY + 14, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...DGRAY)
    doc.text(b.label, bx + boxW / 2, boxY + 22, { align: 'center' })
  })

  // Bottom navy strip
  const stripY = H - 16
  doc.setFillColor(...NAVY)
  doc.rect(0, stripY, W, 16, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 185, 210)
  doc.text('Generated by Solarah · AI-powered solar advisory · solarah.com', W / 2, stripY + 9, { align: 'center' })
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — EXECUTIVE SUMMARY
// ══════════════════════════════════════════════════════════════════════════════
function drawExecutiveSummary(doc, state, specs, isBeginner) {
  let y = 24
  // Intro text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DGRAY)
  const intro = 'This Solarah report is a preliminary screening estimate based on your inputs and broad regional software assumptions. It summarizes indicative system sizing, modeled energy flows, financial estimates, and suggested components; it is not a site survey or construction design.'
  const introLines = doc.splitTextToSize(intro, CW)
  introLines.forEach(l => { doc.text(l, M, y); y += 4.5 })
  y += 6

  // KPI Grid — 3×2
  const kw = (CW - 10) / 3
  const kh = 35
  const currency = 'USD'
  const kpis = isBeginner ? [
    { val: specs.panels, unit: 'panels', label: `${specs.panels} solar panels (each the size of a door)` },
    { val: fmtD(specs.systemKW), unit: 'kWp', label: 'Total system power output' },
    { val: `${currency} ${fmt(specs.annualSavings)}`, unit: '/year', label: 'You save this much every year' },
    { val: formatPayback(specs.payback), unit: '', label: 'System payback' },
    { val: `${currency} ${fmt(specs.lifetimeSavings)}`, unit: 'over 25yr', label: 'Total savings over the system life' },
    { val: fmtD(specs.co2PerYear), unit: 't CO₂/yr', label: 'Carbon you offset each year' },
  ] : [
    { val: fmtD(specs.systemKW), unit: 'kWp', label: 'System capacity' },
    { val: specs.panels, unit: 'panels', label: `${specs.panels} × 400W modules` },
    { val: `${currency} ${fmt(specs.annualSavings)}`, unit: '/year', label: 'Annual savings' },
    { val: formatPayback(specs.payback), unit: '', label: 'Payback period' },
    { val: `${currency} ${fmt(specs.lifetimeSavings)}`, unit: 'over 25yr', label: '25-year lifetime savings' },
    { val: fmtD(specs.co2PerYear), unit: 't CO₂/yr', label: 'CO₂ offset per year' },
  ]
  kpis.forEach((k, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const kx = M + col * (kw + 5)
    const ky = y + row * (kh + 5)
    drawKpiBox(doc, kx, ky, kw, kh, k.val, k.unit, k.label)
  })
  y += 2 * (kh + 5) + 8

  y = drawCalloutBox(doc, y, 'These estimates use unverified regional resource, tariff, equipment-cost, and emissions assumptions. Confirm site conditions, utility rules, and equipment specifications before making procurement or financial decisions.', {
    borderColor: GREEN,
    title: 'Screening estimate'
  })

  y += 2
  if (specs.roofLimited) {
    y = drawCalloutBox(
      doc,
      y,
      `The available roof area limits the array to ${specs.panels} panels. Estimated self-consumed solar energy covers ${specs.roofLoadCoveragePercent}% of the modeled annual load.`,
      { borderColor: AMBER, title: 'Roof area constraint' },
    )
    y += 2
  }
  // Important notice
  drawCalloutBox(doc, y, 'Have the proposed design reviewed by a qualified local solar professional before purchasing equipment, applying for permits, or relying on the financial estimate.', {
    borderColor: AMBER,
    title: 'Important notice'
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — SYSTEM SPECIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
function drawSystemSpecs(doc, state, specs, isBeginner) {
  let y = 24

  if (isBeginner) {
    // Plain-English version
    y = drawSection(doc, 'What your system includes', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...NAVY)
    const texts = [
      `Solar Panels: You need ${specs.panels} solar panels, each about the size of a door (1.7m × 1.1m). They sit on your roof and convert sunlight directly into electricity. Together they produce up to ${specs.systemKW} kWp — that's ${Math.round(specs.systemKW * 1000)} watts of power in peak sunshine, enough to run ${Math.round(specs.systemKW * 1000 / 1500)} air conditioners simultaneously.`,
      `Inverter: A ${specs.inverterKW} kW inverter converts the DC electricity from your panels into the AC electricity your home appliances use. It's about the size of a small suitcase, mounted on your wall near your electrical panel. The hybrid type can manage both grid power and battery storage automatically.`,
      `Battery: ${specs.batteryKWh > 0 ? `A ${specs.batteryKWh} kWh battery stores excess solar energy for use at night or during power outages. Think of it as a large rechargeable power bank for your home. Its modeled usable capacity is ${fmtD(specs.batteryKWh * (specs.assumptions?.depthOfDischarge ?? 0))} kWh.` : 'No battery storage is included in this configuration. Your system sends excess power to the grid and draws from it when needed.'}`
    ]
    texts.forEach(t => {
      const lines = doc.splitTextToSize(t, CW)
      lines.forEach(l => { doc.text(l, M, y); y += 4.5 })
      y += 4
    })
    return
  }

  // Expert mode — two-column layout
  const colW = (CW - 6) / 2

  // Left column — Electrical specifications
  y = drawSection(doc, 'Electrical specifications', y)
  const lat = parseFloat(state.latitude) || 30
  const optTilt = Math.round((Math.abs(lat) * 0.76 + 3.1) * 10) / 10
  const azimuth = lat >= 0 ? '180° (South)' : '0° (North)'
  const panelsPerString = Math.min(specs.panels, Math.ceil(1000 / 40))
  const strings = Math.max(1, Math.ceil(specs.panels / panelsPerString))

  const rows = [
    ['System capacity', `${specs.systemKW} kWp`],
    ['Number of panels', `${specs.panels} × 400W`],
    ['Panel configuration', `${strings} strings × ${panelsPerString} panels/string`],
    ['Inverter rating', `${specs.inverterKW} kW`],
    ['Inverter type', 'Hybrid MPPT'],
    ['Battery capacity', `${specs.batteryKWh} kWh`],
    ...(specs.batteryCapped
      ? [['Battery sizing note', 'Capped so usable storage does not exceed about one day of modeled PV generation or the load-based battery size.']]
      : []),
    ['Battery chemistry', 'LFP (Lithium Iron Phosphate)'],
    ['Battery DoD', '85% (usable)'],
    ['Daily energy load', `${specs.dailyKWh} kWh/day`],
    ['Peak sun hours', `${specs.peakSun} hrs/day`],
    ['System derate factor', '0.80'],
    ['Optimal tilt angle', `${optTilt}°`],
    ['Optimal azimuth', azimuth],
  ]

  // Table header
  const cw1 = colW * 0.55, cw2 = colW * 0.45
  y = drawTableRow(doc, y, 2, ['Parameter', 'Value'], { header: true, bg: NAVY, colWidths: [cw1, cw2] })
  rows.forEach((r, i) => {
    y = drawTableRow(doc, y, 2, r, { bg: i % 2 === 0 ? LGRAY : WHITE, colWidths: [cw1, cw2] })
  })
  y += 6

  y = drawCalloutBox(doc, y, 'Monthly irradiance, shading, and seasonal generation are not modeled. The regional peak-sun value and aggregate performance factor are UNVERIFIED screening assumptions; obtain a site-specific yield study before relying on this estimate.', {
    title: 'Yield limitation',
    borderColor: AMBER,
  })

  // Engineering notes
  if (y < 230) {
    y = drawSection(doc, 'Engineering notes', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...DGRAY)
    const notes = [
      'Sizing uses daily load ÷ (regional peak sun hours × aggregate derate); panel count uses a nominal 400 W module and inverter sizing uses 20% headroom. These inputs are UNVERIFIED.',
      'Savings use modeled self-consumption and battery shifting at the USD import tariff; exports default to zero credit. This calculator is USD-only.',
      'The 25-year projection applies UNVERIFIED 0.5% annual degradation. Resource, tariff, cost, and grid-emissions assumptions have no verified source attached; see METHODOLOGY.md.',
    ]
    notes.forEach(n => {
      const lines = doc.splitTextToSize(n, CW)
      lines.forEach(l => { doc.text(l, M, y); y += 4 })
      y += 3
    })
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — FINANCIAL ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════
function drawFinancialPage(doc, state, specs, isBeginner) {
  let y = 24
  const costCurrency = 'USD'
  const savingsCurrency = 'USD'
  const currenciesComparable = true

  if (isBeginner) {
    const paybackText = formatPayback(specs.payback)
    y = drawCalloutBox(doc, y, `In simple terms: Estimated system cost is ${costCurrency} ${fmt(specs.systemCost)} and modeled annual savings are ${savingsCurrency} ${fmt(specs.annualSavings)}. Estimated payback: ${paybackText}.`, {
      title: 'What this means for your wallet',
      borderColor: GREEN
    })
    y += 2
  }

  // Financial summary table
  y = drawSection(doc, 'Financial summary', y)
  const finRows = [
    ['Estimated system cost', `${costCurrency} ${fmt(specs.systemCost)}`],
    ['Annual electricity savings', `+ ${savingsCurrency} ${fmt(specs.annualSavings)}`],
    ['Modeled payback period', formatPayback(specs.payback)],
    ['25-year lifetime savings', `${savingsCurrency} ${fmt(specs.lifetimeSavings)}`],
  ]
  const fc1 = CW * 0.55, fc2 = CW * 0.45
  y = drawTableRow(doc, y, 2, ['Metric', 'Value'], { header: true, bg: NAVY, colWidths: [fc1, fc2] })
  finRows.forEach((r, i) => {
    y = drawTableRow(doc, y, 2, r, { bg: i % 2 === 0 ? LGRAY : WHITE, colWidths: [fc1, fc2], align: [null, 'right'] })
  })
  y += 8

  // 25-year cumulative savings chart
  y = drawSection(doc, '25-year cumulative savings projection', y, currenciesComparable
    ? 'Net of modeled system cost'
    : 'All amounts are USD.')
  const chartX = M, chartY = y, chartW = CW, chartH = 55
  // Grid background
  doc.setFillColor(...LGRAY)
  doc.rect(chartX, chartY, chartW, chartH, 'F')
  doc.setDrawColor(...BGRAY)
  doc.setLineWidth(0.1)
  // Horizontal grid lines
  for (let i = 0; i <= 4; i++) {
    const gy = chartY + (i / 4) * chartH
    doc.line(chartX, gy, chartX + chartW, gy)
  }

  const projectedSavings = (specs.annualProjection || []).map(year => year.cumulativeSavings)
  const netSavings = currenciesComparable
    ? [-specs.systemCost, ...projectedSavings.map(total => total - specs.systemCost)]
    : [0, ...projectedSavings]

  const maxVal = Math.max(...netSavings, 1)
  const minVal = Math.min(...netSavings, 0)
  const range = maxVal - minVal || 1

  // Y axis labels
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...DGRAY)
  for (let i = 0; i <= 4; i++) {
    const val = maxVal - (i / 4) * range
    const label = Math.abs(val) >= 1000000 ? `${(val / 1000000).toFixed(1)}M` :
                  Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : fmt(val)
    doc.text(label, chartX - 1, chartY + (i / 4) * chartH + 1, { align: 'right' })
  }

  // Plot line
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.6)
  const zeroY = chartY + ((maxVal - 0) / range) * chartH
  for (let yr = 0; yr < netSavings.length - 1; yr++) {
    const x1 = chartX + (yr / 25) * chartW
    const x2 = chartX + ((yr + 1) / 25) * chartW
    const y1 = chartY + ((maxVal - netSavings[yr]) / range) * chartH
    const y2 = chartY + ((maxVal - netSavings[yr + 1]) / range) * chartH
    doc.line(x1, y1, x2, y2)
  }

  const dashLen = 2
  if (currenciesComparable) {
    doc.setDrawColor(...AMBER)
    doc.setLineWidth(0.3)
    for (let dx = chartX; dx < chartX + chartW; dx += dashLen * 2) {
      doc.line(dx, zeroY, Math.min(dx + dashLen, chartX + chartW), zeroY)
    }
  }

  // Payback marker
  if (specs.payback != null) {
    const paybackX = chartX + (specs.payback / 25) * chartW
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(0.4)
    for (let dy = chartY; dy < chartY + chartH; dy += dashLen * 2) {
      doc.line(paybackX, dy, paybackX, Math.min(dy + dashLen, chartY + chartH))
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GREEN)
    doc.text(`Paid off (yr ${specs.payback})`, paybackX + 2, chartY + 6)
  }

  // X axis labels
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...DGRAY)
  for (let yr = 0; yr <= 25; yr += 5) {
    const lx = chartX + (yr / 25) * chartW
    doc.text(String(yr), lx, chartY + chartH + 5, { align: 'center' })
  }
  doc.text('Years', chartX + chartW / 2, chartY + chartH + 10, { align: 'center' })

  // End point label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...AMBER)
  const endVal = netSavings.at(-1)
  doc.text(`${savingsCurrency} ${fmt(endVal)}`, chartX + chartW - 2, chartY + ((maxVal - endVal) / range) * chartH - 3, { align: 'right' })

  y = chartY + chartH + 16

}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 5 — ENVIRONMENTAL IMPACT
// ══════════════════════════════════════════════════════════════════════════════
function drawEnvironmentalPage(doc, state, specs, isBeginner) {
  let y = 24
  const co2Total = specs.annualProjection?.at(-1)?.cumulativeCo2Tonnes ?? 0
  const annualDemand = specs.dailyKWh * 365
  const solarPct = annualDemand > 0
    ? Math.min(100, Math.round((specs.selfConsumedKWh / annualDemand) * 100))
    : 0

  // Green banner
  doc.setFillColor(...GREEN)
  doc.roundedRect(M, y, CW, 28, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...WHITE)
  if (isBeginner) {
    doc.text(`Estimated annual CO₂ offset: ${fmtD(specs.co2PerYear)} tonnes`, M + 8, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`25-year degradation-adjusted estimate: ${fmtD(co2Total)} tonnes; grid factor is UNVERIFIED.`, M + 8, y + 21)
  } else {
    doc.text(`Estimated annual CO₂ offset: ${fmtD(specs.co2PerYear)} tonnes`, M + 8, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`25-year degradation-adjusted estimate: ${fmtD(co2Total)} tonnes; grid factor is UNVERIFIED.`, M + 8, y + 21)
  }
  y += 36

  // Energy independence gauge
  y = drawSection(doc, 'Energy independence', y, `${solarPct}% of your electricity needs covered by solar`)
  const gaugeW = CW - 10, gaugeH = 10
  const gaugeX = M + 5, gaugeY = y
  // Background
  doc.setFillColor(220, 225, 230)
  doc.roundedRect(gaugeX, gaugeY, gaugeW, gaugeH, 3, 3, 'F')
  // Fill
  const fillW = (solarPct / 100) * gaugeW
  doc.setFillColor(...AMBER)
  doc.roundedRect(gaugeX, gaugeY, Math.max(fillW, 6), gaugeH, 3, 3, 'F')
  // Label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHITE)
  if (fillW > 20) {
    doc.text(`${solarPct}%`, gaugeX + fillW / 2, gaugeY + 6.5, { align: 'center' })
  }
  y += gaugeH + 10

  // Carbon timeline chart
  y = drawSection(doc, 'Cumulative CO₂ avoided', y)
  const ctH = 40, ctW = CW
  doc.setFillColor(...LGRAY)
  doc.rect(M, y, ctW, ctH, 'F')
  // Plot
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  const annualProjection = specs.annualProjection || []
  const cumulativeCo2Tonnes = [0, ...annualProjection.map(year => year.cumulativeCo2Tonnes)]
  const maxCO2 = cumulativeCo2Tonnes.at(-1) || 1
  for (let yr = 0; yr < annualProjection.length; yr++) {
    const x1 = M + (yr / 25) * ctW
    const x2 = M + ((yr + 1) / 25) * ctW
    const y1 = y + ctH - (cumulativeCo2Tonnes[yr] / maxCO2) * (ctH - 5)
    const y2 = y + ctH - (cumulativeCo2Tonnes[yr + 1] / maxCO2) * (ctH - 5)
    doc.line(x1, y1, x2, y2)
  }
  // Milestone markers
  ;[50, 100, 200, 500].forEach(milestone => {
    if (milestone <= maxCO2) {
      const crossingIndex = annualProjection.findIndex(year => year.cumulativeCo2Tonnes >= milestone)
      if (crossingIndex >= 0) {
        const previous = annualProjection[crossingIndex - 1]?.cumulativeCo2Tonnes || 0
        const current = annualProjection[crossingIndex].cumulativeCo2Tonnes
        const fraction = (milestone - previous) / (current - previous)
        const myr = crossingIndex + fraction
        const mx = M + (myr / 25) * ctW
        const my = y + ctH - (milestone / maxCO2) * (ctH - 5)
        doc.setFillColor(...GREEN)
        doc.circle(mx, my, 1.5, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(...GREEN)
        doc.text(`${milestone}t`, mx + 3, my + 1)
      }
    }
  })
  // X axis
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...DGRAY)
  for (let yr = 0; yr <= 25; yr += 5) {
    doc.text(String(yr), M + (yr / 25) * ctW, y + ctH + 5, { align: 'center' })
  }
  y += ctH + 12

  drawCalloutBox(doc, y, 'The estimate uses a default grid-emissions factor of 0.445 kg CO₂/kWh. This factor is UNVERIFIED and is not country-specific.', {
    title: 'Emissions-factor limitation',
    borderColor: [...DGRAY]
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 6 — RECOMMENDED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function drawComponentsPage(doc, state, specs, products) {
  let y = 24
  const costCurrency = 'USD'

  const components = [
    {
      category: 'Solar Panels',
      name: products?.panels?.name || `${specs.panels} × 400W Mono PERC Modules`,
      rows: [
        ['Quantity', `${specs.panels} units`],
        ['Wattage', '400W per panel'],
        ['Cell type', 'Mono PERC / Bifacial'],
        ['Efficiency', '21.5%'],
        ['Dimensions', '~1722 × 1134 × 30mm'],
        ['Weight', '~21.3 kg each'],
        ['Operating temp', '-40°C to +85°C'],
        ['Warranty', '25yr product, 30yr performance'],
      ]
    },
    {
      category: 'Inverter',
      name: products?.inverter?.name || `${specs.inverterKW} kW Hybrid MPPT Inverter`,
      rows: [
        ['Rated power', `${specs.inverterKW} kW`],
        ['Type', 'Hybrid MPPT'],
        ['MPPT channels', '2'],
        ['Max DC input', '1000V'],
        ['AC output', specs.inverterKW > 10 ? '400V (3-phase)' : '230V (single-phase)'],
        ['Protection', 'IP65'],
        ['Warranty', '10 years'],
        ['Monitoring', 'Wi-Fi + App'],
      ]
    },
    {
      category: 'Battery',
      name: products?.battery?.name || `${specs.batteryKWh} kWh LFP Battery`,
      rows: [
        ['Capacity', `${specs.batteryKWh} kWh`],
        ['Chemistry', 'LFP (Lithium Iron Phosphate)'],
        ['Usable capacity', `${fmtD(specs.batteryKWh * (specs.assumptions?.depthOfDischarge ?? 0))} kWh`],
        ['Cycle life', '3,500 cycles at 80% DoD'],
        ['Expected lifespan', `${Math.round(3500 / 365)} years`],
        ['Operating temp', '0°C to +55°C'],
        ['Protection class', 'IP55'],
        ['Warranty', '10 years'],
      ]
    }
  ]

  components.forEach(comp => {
    if (y > 210) { doc.addPage(); y = 24 }
    // Component card
    doc.setFillColor(...LGRAY)
    doc.roundedRect(M, y, CW, 6, 1, 1, 'F')
    // TOP PICK badge
    doc.setFillColor(...AMBER)
    doc.roundedRect(W - M - 28, y + 1, 26, 4.5, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...WHITE)
    doc.text('TOP PICK', W - M - 15, y + 4, { align: 'center' })
    // Category label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...AMBER)
    doc.text(comp.category.toUpperCase(), M + 4, y + 4)
    y += 10

    // Component name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text(comp.name, M, y)
    y += 7

    // Specs table
    const tcw1 = CW * 0.45, tcw2 = CW * 0.55
    comp.rows.forEach((r, i) => {
      y = drawTableRow(doc, y, 2, r, { bg: i % 2 === 0 ? LGRAY : WHITE, colWidths: [tcw1, tcw2] })
    })
    y += 6
  })

  // Cost breakdown
  if (y > 220) { doc.addPage(); y = 24 }
  y = drawSection(doc, 'Estimated cost breakdown', y)
  const costs = specs.costBreakdown || {}
  const costRows = [
    ['Solar panels', `${costCurrency} ${fmt(costs.pv)}`],
    ['Inverter', `${costCurrency} ${fmt(costs.inverter)}`],
    ['Battery storage', `${costCurrency} ${fmt(costs.battery)}`],
    ['Balance of system (wiring, mounting)', `${costCurrency} ${fmt(costs.bos)}`],
    ['Installation labor', `${costCurrency} ${fmt(costs.labour)}`],
    ['Permits', `${costCurrency} ${fmt(costs.permits)}`],
    ['Total', `${costCurrency} ${fmt(specs.systemCost)}`],
  ]
  const cc1 = CW * 0.6, cc2 = CW * 0.4
  y = drawTableRow(doc, y, 2, ['Component', 'Estimated Cost'], { header: true, bg: NAVY, colWidths: [cc1, cc2] })
  costRows.forEach((r, i) => {
    const isLast = i === costRows.length - 1
    y = drawTableRow(doc, y, 2, r, { bg: isLast ? [...AMBER] : (i % 2 === 0 ? LGRAY : WHITE), colWidths: [cc1, cc2], align: [null, 'right'] })
  })
  y += 6

  drawCalloutBox(doc, y, 'Solarah earns a small affiliate commission on component purchases at no extra cost to you. All products are independently selected based on performance and global availability.', {
    title: 'Purchase note',
    borderColor: AMBER,
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 7 — METHODOLOGY (expert only)
// ══════════════════════════════════════════════════════════════════════════════
function drawMethodologyPage(doc) {
  let y = 24
  y = drawSection(doc, 'System sizing methodology', y)

  // Formula box
  doc.setFillColor(240, 242, 248)
  doc.roundedRect(M, y, CW, 38, 2, 2, 'F')
  doc.setDrawColor(...BGRAY)
  doc.rect(M, y, CW, 38)
  doc.setFont('courier', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...NAVY)
  const formulas = [
    'System kWp  = Daily kWh ÷ (PSH × Derate)',
    'Panel count = ceil(System kWp ÷ 0.400)',
    'Inverter kW = Array kWp × 1.20 (headroom)',
    'Battery kWh = (Daily kWh × 0.50) ÷ 0.85 DoD',
  ]
  formulas.forEach((f, i) => {
    doc.text(f, M + 6, y + 8 + i * 8)
  })
  y += 46

  // Data sources
  y = drawSection(doc, 'Source status', y)
  const sources = [
    ['Regional irradiance', 'UNVERIFIED — no primary source attached', 'UNVERIFIED'],
    ['Tariffs and export rules', 'UNVERIFIED — validate with local utility', 'UNVERIFIED'],
    ['Component cost rates', 'UNVERIFIED — not supplier quotes', 'UNVERIFIED'],
    ['Grid emission factor', 'UNVERIFIED — not country-specific', 'UNVERIFIED'],
  ]
  const sc1 = CW * 0.35, sc2 = CW * 0.45, sc3 = CW * 0.20
  y = drawTableRow(doc, y, 3, ['Parameter', 'Source', 'Year'], { header: true, bg: NAVY, colWidths: [sc1, sc2, sc3] })
  sources.forEach((s, i) => {
    y = drawTableRow(doc, y, 3, s, { bg: i % 2 === 0 ? LGRAY : WHITE, colWidths: [sc1, sc2, sc3] })
  })
  y += 8

  // Assumptions
  y = drawSection(doc, 'Key assumptions', y)
  const assumptions = [
    'PV aggregate performance factor: 0.80 (UNVERIFIED)',
    'Daytime load fractions: residential 0.35; commercial/industrial 0.65 (UNVERIFIED)',
    'Battery round-trip efficiency: 0.92; depth of discharge: 0.85 (UNVERIFIED)',
    'Annual degradation: 0.5% (UNVERIFIED); no inverter or battery replacement modeled',
    'Default export tariff: 0 unless a user enters an applicable rate',
    'Grid emissions factor: 0.445 kg CO₂/kWh (UNVERIFIED; not country-specific)',
    'Bills, tariffs, costs, and modeled savings are USD-only',
    'NPV and IRR are not calculated in this report',
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DGRAY)
  assumptions.forEach(a => {
    doc.text(`•  ${a}`, M + 4, y)
    y += 5.5
  })
  y += 6

  // Limitations
  y = drawCalloutBox(doc, y, 'This tool provides indicative sizing based on unverified regional software assumptions. Shading, roof orientation, local tariffs, and interconnection requirements are not validated; a site survey is required before procurement.', {
    title: 'Limitations',
    borderColor: AMBER,
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 8 — NEXT STEPS
// ══════════════════════════════════════════════════════════════════════════════
function drawNextStepsPage(doc) {
  let y = 24
  y = drawSection(doc, 'What happens next', y, 'Your roadmap from report to running system')

  const milestones = [
    {
      title: 'Book a virtual consultation',
      desc: 'A Solarah engineer reviews this report, checks system suitability for your site, and answers your questions — all online, free of charge.',
      cta: 'Visit solarah-five.vercel.app/engineers to book'
    },
    {
      title: 'Site survey and permitting',
      desc: 'Your engineer arranges a local installer to assess your roof structure, shading, and electrical installation requirements. Permit applications are submitted to your local authority and Distribution Network Operator.'
    },
    {
      title: 'Purchase components',
      desc: "Components are ordered through Solarah's verified supplier network. Typical delivery: 2–4 weeks. Your engineer coordinates delivery scheduling."
    },
    {
      title: 'Installation (1–3 days)',
      desc: 'Certified installers mount the system, run all DC and AC wiring, connect the battery and inverter, and perform initial commissioning tests.'
    },
    {
      title: 'Grid connection and monitoring',
      desc: 'The Distribution Network Operator connects your system to the grid. Monitoring is set up on your phone so you can track generation, consumption, and savings in real time.'
    },
  ]

  milestones.forEach((m, i) => {
    const my = y
    // Timeline line
    if (i < milestones.length - 1) {
      doc.setDrawColor(...AMBER)
      doc.setLineWidth(0.8)
      doc.line(M + 6, my + 8, M + 6, my + 44)
    }
    // Circle with number
    doc.setFillColor(...AMBER)
    doc.circle(M + 6, my + 4, 4, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...WHITE)
    doc.text(String(i + 1), M + 6, my + 5.5, { align: 'center' })
    // Title
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text(m.title, M + 16, my + 5)
    // Description
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...DGRAY)
    const lines = doc.splitTextToSize(m.desc, CW - 20)
    lines.forEach((l, li) => {
      doc.text(l, M + 16, my + 12 + li * 4.5)
    })
    // CTA box
    if (m.cta) {
      const ctaY = my + 12 + lines.length * 4.5 + 2
      doc.setFillColor(255, 250, 240)
      doc.roundedRect(M + 16, ctaY, CW - 20, 7, 1, 1, 'F')
      doc.setDrawColor(...AMBER)
      doc.rect(M + 16, ctaY, CW - 20, 7)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...AMBER)
      doc.text(m.cta, M + 20, ctaY + 4.5)
    }
    y = my + 12 + lines.length * 4.5 + (m.cta ? 16 : 8)
  })

  // QR code placeholder
  if (y < 245) {
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...NAVY)
    doc.text('Access your Solarah dashboard:', M, y)
    // Draw a simplified QR code (small squares grid)
    const qx = M, qy = y + 4, qs = 25
    doc.setFillColor(...NAVY)
    doc.rect(qx, qy, qs, qs, 'F')
    doc.setFillColor(...WHITE)
    // Random pattern to simulate QR
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 3 !== 0) {
          doc.rect(qx + 1 + c * 2.8, qy + 1 + r * 2.8, 2.2, 2.2, 'F')
        }
      }
    }
    // Corner markers
    doc.setFillColor(...NAVY)
    doc.rect(qx + 1, qy + 1, 6, 6, 'F')
    doc.setFillColor(...WHITE)
    doc.rect(qx + 2.5, qy + 2.5, 3, 3, 'F')
    doc.setFillColor(...NAVY)
    doc.rect(qx + 3, qy + 3, 2, 2, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...NAVY)
    doc.text('solarah-five.vercel.app/dashboard', qx + qs + 6, qy + 10)
    doc.setFontSize(7.5)
    doc.setTextColor(...DGRAY)
    doc.text('Log in to view your reports, book engineers, and track savings.', qx + qs + 6, qy + 16)
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// PAGE 9 — GLOSSARY (beginner only)
// ══════════════════════════════════════════════════════════════════════════════
function drawGlossaryPage(doc) {
  let y = 24
  y = drawSection(doc, 'Solar glossary — Key terms explained', y)

  const glossary = [
    ['Solar Panel', 'A flat device (about the size of a door) that converts sunlight into electricity. Multiple panels form your "solar array." They have no moving parts and last 25–30 years.'],
    ['Inverter', 'A device that converts the direct current (DC) electricity from your panels into the alternating current (AC) electricity your home appliances use. About the size of a small suitcase.'],
    ['Battery', 'A storage unit that saves excess solar electricity for use at night or during power outages. Think of it as a large rechargeable power bank for your home.'],
    ['kWp (kilowatt-peak)', 'The maximum power your solar system can produce in perfect sunshine conditions. A 5 kWp system produces about 5,000 watts at peak — enough to run 3 air conditioners.'],
    ['kWh (kilowatt-hour)', 'A unit of energy your electricity bill is measured in. One kWh is enough to run a fridge for about 7 hours or charge your phone 40 times.'],
    ['Grid-tied', 'A system connected to the electricity grid. Excess solar power goes to the grid and you draw from the grid when the sun is not shining. Simplest and cheapest configuration.'],
    ['Hybrid', 'A system with both grid connection and battery storage — the best of both worlds. It works during power outages and maximizes self-consumption of your solar energy.'],
    ['Off-grid', 'A system completely independent from the electricity grid. Relies entirely on solar panels and batteries. Common in remote areas without grid access.'],
    ['Peak Sun Hours', 'The number of hours per day when sunshine is strong enough for maximum solar production. Higher peak sun hours = more electricity generated = faster payback.'],
    ['Payback Period', 'The number of years it takes for your electricity savings to equal the cost of the solar system. After this point, everything you save is pure profit.'],
  ]

  // Two-column table
  const cw1 = CW * 0.25, cw2 = CW * 0.75
  y = drawTableRow(doc, y, 2, ['Term', 'Definition'], { header: true, bg: NAVY, colWidths: [cw1, cw2] })

  glossary.forEach((g, i) => {
    const lines = doc.splitTextToSize(g[1], cw2 - 6)
    const rowH = Math.max(8, lines.length * 4 + 4)
    // Background
    doc.setFillColor(...(i % 2 === 0 ? LGRAY : WHITE))
    doc.rect(M, y - 5.5, CW, rowH, 'F')
    doc.setDrawColor(...BGRAY)
    doc.setLineWidth(0.15)
    doc.rect(M, y - 5.5, cw1, rowH)
    doc.rect(M + cw1, y - 5.5, cw2, rowH)
    // Term
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...AMBER)
    doc.text(g[0], M + 3, y - 0.5)
    // Definition
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...NAVY)
    lines.forEach((l, li) => {
      doc.text(l, M + cw1 + 3, y - 0.5 + li * 4)
    })
    y += rowH
    if (y > 265) { doc.addPage(); y = 24 }
  })
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Expert mode
// ══════════════════════════════════════════════════════════════════════════════
export async function generatePDF(state, providedSpecs, products, aiText) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const rid = reportId()
  const dateStr = today()

  state = state || {}
  const specs = state.sector
    ? computeDesignForConsumer('expert-pdf', state)
    : providedSpecs || {}
  if (!products) products = {}

  // P1: Cover
  drawCoverPage(doc, state, specs, rid, dateStr, false)

  // P2: Executive Summary
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Executive Summary', rid)
  drawExecutiveSummary(doc, state, specs, false)

  // P3: System Specifications
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'System Specifications', rid)
  drawSystemSpecs(doc, state, specs, false)

  // P4: Financial Analysis
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Financial Analysis', rid)
  drawFinancialPage(doc, state, specs, false)

  // P5: Environmental Impact
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Environmental Impact', rid)
  drawEnvironmentalPage(doc, state, specs, false)

  // P6: Recommended Components
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Recommended Components', rid)
  drawComponentsPage(doc, state, specs, products)

  // P7: Methodology (expert only)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Methodology', rid)
  drawMethodologyPage(doc)

  // P8: Next Steps
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Next Steps', rid)
  drawNextStepsPage(doc)

  // AI Analysis — append if available
  if (aiText && aiText.length > 10) {
    doc.addPage()
    drawWatermark(doc)
    drawPageHeader(doc, 'AI System Analysis', rid)
    let y = 24
    y = drawSection(doc, 'AI-powered system analysis', y, 'Generated by Solarah AI using your system parameters')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(44, 62, 80)
    const lines = doc.splitTextToSize(aiText, CW)
    for (let i = 0; i < lines.length; i++) {
      if (y > 272) {
        doc.addPage()
        drawWatermark(doc)
        drawPageHeader(doc, 'AI System Analysis (cont.)', rid)
        y = 24
      }
      doc.text(lines[i], M, y)
      y += 4.5
    }
  }

  // Post-process: add footers to all pages except cover
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    drawPageFooter(doc, i, totalPages, dateStr)
  }

  const name = state.name || 'Homeowner'
  doc.save(`Solarah_Report_${name.replace(/\s+/g, '_')}.pdf`)
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — Beginner mode
// ══════════════════════════════════════════════════════════════════════════════
export async function generateBeginnerPDF(state, providedSpecs, products, aiText) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const rid = reportId()
  const dateStr = today()

  state = state || {}
  const specs = state.sector
    ? computeDesignForConsumer('beginner-pdf', state)
    : providedSpecs || {}
  if (!products) products = {}

  // P1: Cover (with beginner badge)
  drawCoverPage(doc, state, specs, rid, dateStr, true)

  // P2: Executive Summary (beginner language)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Your Report at a Glance', rid)
  drawExecutiveSummary(doc, state, specs, true)

  // P3: What Your System Includes (beginner specs)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'What Your System Includes', rid)
  drawSystemSpecs(doc, state, specs, true)

  // P4: Financial — Your Savings
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Your Savings Forecast', rid)
  drawFinancialPage(doc, state, specs, true)

  // P5: Environmental Impact (beginner-friendly)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Good for the Planet', rid)
  drawEnvironmentalPage(doc, state, specs, true)

  // P6: What to Buy
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'What to Buy', rid)
  drawComponentsPage(doc, state, specs, products)

  // P7: Next Steps (skip methodology)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Your Next Steps', rid)
  drawNextStepsPage(doc)

  // AI Analysis
  if (aiText && aiText.length > 10) {
    doc.addPage()
    drawWatermark(doc)
    drawPageHeader(doc, 'What Our AI Thinks', rid)
    let y = 24
    y = drawSection(doc, 'AI-powered analysis of your system', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(44, 62, 80)
    const lines = doc.splitTextToSize(aiText, CW)
    for (let i = 0; i < lines.length; i++) {
      if (y > 272) {
        doc.addPage()
        drawWatermark(doc)
        drawPageHeader(doc, 'What Our AI Thinks (cont.)', rid)
        y = 24
      }
      doc.text(lines[i], M, y)
      y += 4.5
    }
  }

  // P9: Glossary (beginner only)
  doc.addPage()
  drawWatermark(doc)
  drawPageHeader(doc, 'Solar Glossary', rid)
  drawGlossaryPage(doc)

  // Post-process: footers
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    drawPageFooter(doc, i, totalPages, dateStr)
  }

  const name = state.name || 'Homeowner'
  doc.save(`Solarah_Report_${name.replace(/\s+/g, '_')}.pdf`)
}
