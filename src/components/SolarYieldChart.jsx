// ── Solarah Solar Yield Charts ────────────────────────────────────────────────
// Four pure-SVG data visualizations in a 2×2 grid with animations and tooltips.

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Sun position math (same as SunPath.jsx) ───────────────────────────────────
const toRad = d => d * Math.PI / 180
const toDeg = r => r * 180 / Math.PI

function sunPosition(date, lat, lon) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate()
  const JD = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5
  const T = (JD - 2451545.0) / 36525
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  L0 = ((L0 % 360) + 360) % 360
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  M = toRad(((M % 360) + 360) % 360)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M)
  const sunLon = L0 + C
  const omega = 125.04 - 1934.136 * T
  const lambda = toRad(sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega)))
  const obliq = toRad(23.439291 - 0.013004 * T)
  const decl = Math.asin(Math.sin(obliq) * Math.sin(lambda))
  const y2 = Math.tan(obliq / 2) ** 2
  const EqT = toDeg(y2 * Math.sin(2 * toRad(L0))
    - 2 * 0.016708634 * Math.sin(M)
    + 4 * 0.016708634 * y2 * Math.sin(M) * Math.cos(2 * toRad(L0))
    - 0.5 * y2 ** 2 * Math.sin(4 * toRad(L0))
    - 1.25 * 0.016708634 ** 2 * Math.sin(2 * M)) * 4
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60
  const solarNoon = 12 - lon / 15 - EqT / 60
  const hourAngle = toRad((utcH - solarNoon) * 15)
  const latR = toRad(lat)
  const altitude = Math.asin(
    Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle)
  )
  return { altitude: toDeg(altitude) }
}

// ── Monthly weights (northern hemisphere) ─────────────────────────────────────
const NH_WEIGHTS = [0.058, 0.068, 0.092, 0.101, 0.110, 0.114, 0.112, 0.105, 0.090, 0.080, 0.045, 0.025]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
.syc-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
@media(max-width:768px){.syc-grid{grid-template-columns:1fr}}
.syc-card{background:rgba(255,255,255,0.03);border:.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:1rem 1.25rem;position:relative;overflow:hidden}
.syc-title{font-size:12px;font-weight:700;color:#F5A623;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.syc-tip{position:absolute;pointer-events:none;background:rgba(11,31,58,0.95);border:.5px solid rgba(245,166,35,0.3);border-radius:6px;padding:5px 9px;font-size:10px;color:rgba(255,255,255,0.8);white-space:nowrap;z-index:10;transform:translate(-50%,-110%)}
.syc-tip::after{content:'';position:absolute;left:50%;bottom:-4px;transform:translateX(-50%);border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid rgba(245,166,35,0.3)}
`

// ── Chart 1: Monthly Generation Bars ──────────────────────────────────────────

function MonthlyChart({ annualKWh, lat }) {
  const [anim, setAnim] = useState(0)
  const [hover, setHover] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const id = setInterval(() => { frame++; setAnim(frame); if (frame >= 12) clearInterval(id) }, 50)
    return () => clearInterval(id)
  }, [])

  const annual = annualKWh || 7000
  const isSouth = (lat || 0) < 0
  const weights = isSouth ? [...NH_WEIGHTS.slice(5), ...NH_WEIGHTS.slice(0, 5)] : NH_WEIGHTS
  const data = weights.map((w, i) => ({ month: MONTHS[i], kwh: Math.round(annual * w) }))
  const maxKWh = Math.max(...data.map(d => d.kwh))

  const W = 380, H = 200, pad = { t: 10, b: 28, l: 38, r: 10 }
  const chartW = W - pad.l - pad.r
  const chartH = H - pad.t - pad.b
  const barW = chartW / 12 - 4

  const getMouseBar = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - pad.l
    const idx = Math.floor(x / (chartW / 12))
    if (idx >= 0 && idx < 12) setHover(idx)
    else setHover(null)
  }, [chartW])

  return (
    <div className="syc-card">
      <div className="syc-title">Monthly generation estimate</div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        onMouseMove={getMouseBar} onMouseLeave={() => setHover(null)}>
        {/* Y axis */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => {
          const y = pad.t + chartH * (1 - f)
          return (
            <g key={f}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth=".5" />
              <text x={pad.l - 4} y={y + 3} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.25)">{Math.round(maxKWh * f)}</text>
            </g>
          )
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const x = pad.l + i * (chartW / 12) + 2
          const fullH = (d.kwh / maxKWh) * chartH
          const h = i < anim ? fullH : 0
          const y = pad.t + chartH - h
          const isHov = hover === i
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={3}
                fill={isHov ? '#ffd065' : '#F5A623'} opacity={isHov ? 1 : 0.75}
                style={{ transition: 'height .3s ease, y .3s ease' }} />
              <text x={x + barW / 2} y={H - pad.b + 12} textAnchor="middle" fontSize="7"
                fill={isHov ? '#F5A623' : 'rgba(255,255,255,0.3)'}>{d.month}</text>
            </g>
          )
        })}
        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <rect x={pad.l + hover * (chartW / 12) + barW / 2 - 24} y={pad.t + chartH - (data[hover].kwh / maxKWh) * chartH - 22}
              width="48" height="18" rx="4" fill="rgba(11,31,58,0.95)" stroke="rgba(245,166,35,0.3)" strokeWidth=".5" />
            <text x={pad.l + hover * (chartW / 12) + barW / 2} y={pad.t + chartH - (data[hover].kwh / maxKWh) * chartH - 9}
              textAnchor="middle" fontSize="8" fontWeight="700" fill="#F5A623">{data[hover].kwh} kWh</text>
          </g>
        )}
        <text x={pad.l} y={H - 2} fontSize="7" fill="rgba(255,255,255,0.2)">kWh/month</text>
      </svg>
    </div>
  )
}

// ── Chart 2: 25-Year Degradation + Cumulative Savings ─────────────────────────

function DegradationChart({ annualKWh, lifetimeSavings, payback, annualSavings }) {
  const [anim, setAnim] = useState(0)
  const [hover, setHover] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    let frame = 0
    const id = setInterval(() => { frame++; setAnim(frame); if (frame >= 25) clearInterval(id) }, 40)
    return () => clearInterval(id)
  }, [])

  const annual = annualKWh || 7000
  const savings = annualSavings || (lifetimeSavings || 50000) / 25
  const paybackYr = payback || 6

  const years = Array.from({ length: 25 }, (_, i) => {
    const yr = i + 1
    const output = annual * (0.995 ** i)
    const cumSavings = Array.from({ length: yr }, (_, j) => savings * (0.995 ** j)).reduce((a, b) => a + b, 0)
    return { yr, output, cumSavings }
  })

  const maxOutput = annual
  const maxSavings = years[24].cumSavings

  const W = 380, H = 200, pad = { t: 15, b: 28, l: 38, r: 38 }
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b

  const outputPath = years.slice(0, anim).map((d, i) => {
    const x = pad.l + (i / 24) * chartW
    const y = pad.t + chartH - (d.output / maxOutput) * chartH
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  const savingsPath = years.slice(0, anim).map((d, i) => {
    const x = pad.l + (i / 24) * chartW
    const y = pad.t + chartH - (d.cumSavings / maxSavings) * chartH
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  const paybackX = pad.l + ((paybackYr - 1) / 24) * chartW

  const getHoverYear = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - pad.l
    const idx = Math.round((x / chartW) * 24)
    if (idx >= 0 && idx < 25) setHover(idx)
    else setHover(null)
  }, [chartW])

  return (
    <div className="syc-card">
      <div className="syc-title">25-year output & savings</div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        onMouseMove={getHoverYear} onMouseLeave={() => setHover(null)}>
        {/* Grid */}
        {[0, 0.5, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} y1={pad.t + chartH * (1 - f)} x2={W - pad.r} y2={pad.t + chartH * (1 - f)} stroke="rgba(255,255,255,0.04)" strokeWidth=".5" />
            <text x={pad.l - 4} y={pad.t + chartH * (1 - f) + 3} textAnchor="end" fontSize="6" fill="rgba(255,255,255,0.2)">{Math.round(maxOutput * f)}</text>
            <text x={W - pad.r + 4} y={pad.t + chartH * (1 - f) + 3} fontSize="6" fill="rgba(39,174,96,0.35)">{Math.round(maxSavings * f / 1000)}k</text>
          </g>
        ))}
        {/* X-axis labels */}
        {[1, 5, 10, 15, 20, 25].map(yr => (
          <text key={yr} x={pad.l + ((yr - 1) / 24) * chartW} y={H - pad.b + 14} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)">{yr}</text>
        ))}
        {/* Payback line */}
        <line x1={paybackX} y1={pad.t} x2={paybackX} y2={pad.t + chartH} stroke="#F5A623" strokeWidth="1" strokeDasharray="4,3" />
        <rect x={paybackX - 24} y={pad.t - 2} width="48" height="14" rx="3" fill="rgba(245,166,35,0.1)" stroke="rgba(245,166,35,0.2)" strokeWidth=".5" />
        <text x={paybackX} y={pad.t + 9} textAnchor="middle" fontSize="7" fontWeight="700" fill="#F5A623">Payback</text>
        {/* Output line */}
        {outputPath && <path d={outputPath} fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />}
        {/* Savings line */}
        {savingsPath && <path d={savingsPath} fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" />}
        {/* Legend */}
        <line x1={pad.l} y1={H - 4} x2={pad.l + 15} y2={H - 4} stroke="#F5A623" strokeWidth="1.5" />
        <text x={pad.l + 18} y={H - 1} fontSize="6.5" fill="rgba(255,255,255,0.3)">Annual kWh</text>
        <line x1={pad.l + 80} y1={H - 4} x2={pad.l + 95} y2={H - 4} stroke="#27AE60" strokeWidth="1.5" />
        <text x={pad.l + 98} y={H - 1} fontSize="6.5" fill="rgba(255,255,255,0.3)">Cumulative $</text>
        {/* Hover */}
        {hover !== null && hover < years.length && (() => {
          const d = years[hover]
          const x = pad.l + (hover / 24) * chartW
          return (
            <g>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth=".5" />
              <circle cx={x} cy={pad.t + chartH - (d.output / maxOutput) * chartH} r="3" fill="#F5A623" />
              <circle cx={x} cy={pad.t + chartH - (d.cumSavings / maxSavings) * chartH} r="3" fill="#27AE60" />
              <rect x={x - 35} y={pad.t + chartH - (d.output / maxOutput) * chartH - 22} width="70" height="16" rx="3" fill="rgba(11,31,58,0.95)" stroke="rgba(245,166,35,0.2)" strokeWidth=".5" />
              <text x={x} y={pad.t + chartH - (d.output / maxOutput) * chartH - 10} textAnchor="middle" fontSize="7" fill="#F5A623">Yr {d.yr}: {Math.round(d.output)} kWh</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Chart 3: Self-Consumption Donut ───────────────────────────────────────────

function DonutChart({ selfConsumptionRate, hasGrid }) {
  const [anim, setAnim] = useState(0)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    let start = null
    const dur = 800
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      setAnim(p)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  const self = selfConsumptionRate || 65
  const exported = hasGrid ? Math.min(100 - self, 100 - self) : 0
  const gridImport = 100 - self - exported

  const segments = [
    { label: 'Self-consumed', pct: self, color: '#F5A623' },
    { label: 'Exported', pct: exported, color: '#3B82F6' },
    { label: 'Grid import', pct: gridImport > 0 ? gridImport : 0, color: 'rgba(255,255,255,0.15)' },
  ].filter(s => s.pct > 0)

  const W = 380, H = 200, cx = W / 2, cy = 95, R = 70, r = 45

  function arc(startAngle, endAngle) {
    const s = toRad(startAngle - 90), e = toRad(endAngle - 90)
    const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s)
    const x2 = cx + R * Math.cos(e), y2 = cy + R * Math.sin(e)
    const x3 = cx + r * Math.cos(e), y3 = cy + r * Math.sin(e)
    const x4 = cx + r * Math.cos(s), y4 = cy + r * Math.sin(s)
    const large = endAngle - startAngle > 180 ? 1 : 0
    return `M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${large} 0 ${x4},${y4} Z`
  }

  let angle = 0
  const arcs = segments.map(s => {
    const start = angle
    const sweep = (s.pct / 100) * 360 * anim
    angle += sweep
    return { ...s, start, sweep, end: start + sweep, mid: start + sweep / 2 }
  })

  return (
    <div className="syc-card">
      <div className="syc-title">Energy consumption breakdown</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        onMouseLeave={() => setHover(null)}>
        {arcs.map((a, i) => (
          <path key={i} d={arc(a.start, a.end)} fill={a.color} opacity={hover === i ? 1 : 0.8}
            stroke="#0B1F3A" strokeWidth="2"
            onMouseEnter={() => setHover(i)}
            style={{ cursor: 'pointer', transition: 'opacity .15s' }} />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#F5A623">{self}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.35)">Self-consumed</text>
        {/* Legend */}
        {segments.map((s, i) => (
          <g key={i} transform={`translate(${50 + i * 120}, ${H - 15})`}>
            <rect x="0" y="-6" width="8" height="8" rx="2" fill={s.color} />
            <text x="12" y="1" fontSize="8" fill="rgba(255,255,255,0.4)">{s.label} ({s.pct}%)</text>
          </g>
        ))}
        {/* Hover tooltip */}
        {hover !== null && arcs[hover] && (() => {
          const a = arcs[hover]
          const midR = toRad(a.mid - 90)
          const tx = cx + (R + 20) * Math.cos(midR)
          const ty = cy + (R + 20) * Math.sin(midR)
          return (
            <g>
              <rect x={tx - 28} y={ty - 10} width="56" height="18" rx="4" fill="rgba(11,31,58,0.95)" stroke="rgba(245,166,35,0.3)" strokeWidth=".5" />
              <text x={tx} y={ty + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={a.color}>{a.label}: {a.pct}%</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Chart 4: Daily Generation Profile (Summer/Winter/Equinox) ─────────────────

function DailyProfileChart({ lat: latProp }) {
  const [anim, setAnim] = useState(0)
  const [hover, setHover] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    let start = null
    const dur = 600
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      setAnim(p)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  const lat = latProp || 30
  const lon = 0

  // Three representative dates
  const dates = [
    { label: 'Summer', date: new Date(Date.UTC(2024, lat >= 0 ? 5 : 11, 21)), color: '#F5A623', dash: '' },
    { label: 'Equinox', date: new Date(Date.UTC(2024, 2, 21)), color: '#27AE60', dash: '6,3' },
    { label: 'Winter', date: new Date(Date.UTC(2024, lat >= 0 ? 11 : 5, 21)), color: '#3B82F6', dash: '3,3' },
  ]

  // Generate curves: hours 5-21, altitude as % of max
  const curves = dates.map(({ label, date, color, dash }) => {
    const points = []
    let maxAlt = 0
    for (let h = 5; h <= 21; h += 0.5) {
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, (h % 1) * 60))
      const pos = sunPosition(d, lat, lon)
      maxAlt = Math.max(maxAlt, pos.altitude)
      points.push({ h, alt: Math.max(0, pos.altitude) })
    }
    return { label, color, dash, points, maxAlt }
  })

  const globalMax = Math.max(...curves.map(c => c.maxAlt), 1)

  const W = 380, H = 200, pad = { t: 10, b: 28, l: 32, r: 10 }
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b

  function toPath(points, fill = false) {
    const pts = points.map((p, i) => {
      const x = pad.l + ((p.h - 5) / 16) * chartW
      const y = pad.t + chartH - (p.alt / globalMax) * chartH * anim
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
    if (fill) {
      const lastX = pad.l + ((points[points.length - 1].h - 5) / 16) * chartW
      const firstX = pad.l + ((points[0].h - 5) / 16) * chartW
      return pts + ` L${lastX},${pad.t + chartH} L${firstX},${pad.t + chartH} Z`
    }
    return pts
  }

  const getHoverHour = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) * (W / rect.width) - pad.l
    const h = 5 + (x / chartW) * 16
    if (h >= 5 && h <= 21) setHover(Math.round(h * 2) / 2)
    else setHover(null)
  }, [chartW])

  return (
    <div className="syc-card">
      <div className="syc-title">Daily generation profile</div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        onMouseMove={getHoverHour} onMouseLeave={() => setHover(null)}>
        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <g key={f}>
            <line x1={pad.l} y1={pad.t + chartH * (1 - f)} x2={W - pad.r} y2={pad.t + chartH * (1 - f)} stroke="rgba(255,255,255,0.04)" strokeWidth=".5" />
            <text x={pad.l - 4} y={pad.t + chartH * (1 - f) + 3} textAnchor="end" fontSize="6" fill="rgba(255,255,255,0.2)">{Math.round(f * 100)}%</text>
          </g>
        ))}
        {/* X labels */}
        {[5, 7, 9, 11, 13, 15, 17, 19, 21].map(h => (
          <text key={h} x={pad.l + ((h - 5) / 16) * chartW} y={H - pad.b + 14} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)">{h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}</text>
        ))}
        {/* Area fills */}
        {curves.map((c, ci) => (
          <path key={`fill-${ci}`} d={toPath(c.points, true)} fill={c.color} opacity="0.06" />
        ))}
        {/* Lines */}
        {curves.map((c, ci) => (
          <path key={`line-${ci}`} d={toPath(c.points)} fill="none" stroke={c.color} strokeWidth="2"
            strokeDasharray={c.dash} strokeLinecap="round" />
        ))}
        {/* Legend */}
        {curves.map((c, ci) => (
          <g key={`leg-${ci}`} transform={`translate(${pad.l + ci * 100}, ${H - 4})`}>
            <line x1="0" y1="-2" x2="14" y2="-2" stroke={c.color} strokeWidth="1.5" strokeDasharray={c.dash} />
            <text x="18" y="1" fontSize="7" fill="rgba(255,255,255,0.35)">{c.label}</text>
          </g>
        ))}
        {/* Hover line */}
        {hover !== null && (() => {
          const x = pad.l + ((hover - 5) / 16) * chartW
          return (
            <g>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth=".5" />
              {curves.map((c, ci) => {
                const pt = c.points.find(p => Math.abs(p.h - hover) < 0.3)
                if (!pt) return null
                const y = pad.t + chartH - (pt.alt / globalMax) * chartH
                return <circle key={ci} cx={x} cy={y} r="3" fill={c.color} />
              })}
              <rect x={x - 30} y={pad.t - 2} width="60" height="14" rx="3" fill="rgba(11,31,58,0.95)" stroke="rgba(255,255,255,0.1)" strokeWidth=".5" />
              <text x={x} y={pad.t + 9} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.6)">{hover > 12 ? `${hover - 12}:00 PM` : hover === 12 ? '12:00 PM' : `${hover}:00 AM`}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SolarYieldChart({ specs, lat }) {
  const annualKWh = specs?.annualKWh || (specs?.dailyKWh ? specs.dailyKWh * 365 : 7000)
  const lifetimeSavings = specs?.lifetimeSavings || 50000
  const payback = specs?.payback || 6
  const annualSavings = specs?.annualSavings || specs?.energySavings || lifetimeSavings / 25
  const selfConsumptionRate = specs?.selfConsumptionRate || 65
  const hasGrid = (specs?.batteryKWh || 0) > 0 || !specs?.offGrid

  return (
    <div>
      <style>{CSS}</style>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
        Solar yield analysis
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        Performance projections
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
        {Math.round(annualKWh).toLocaleString()} kWh/year estimated · {Math.abs(lat || 30).toFixed(1)}° {(lat || 30) >= 0 ? 'N' : 'S'}
      </div>
      <div className="syc-grid">
        <MonthlyChart annualKWh={annualKWh} lat={lat} />
        <DegradationChart annualKWh={annualKWh} lifetimeSavings={lifetimeSavings} payback={payback} annualSavings={annualSavings} />
        <DonutChart selfConsumptionRate={selfConsumptionRate} hasGrid={hasGrid} />
        <DailyProfileChart lat={lat} />
      </div>
    </div>
  )
}
