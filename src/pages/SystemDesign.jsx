// ── Solarah System Design Report ──────────────────────────────────────────────
// 7-section report with sticky ToC sidebar, SVG export, and all component wiring.

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SystemDiagram from '../components/SystemDiagram'
import SystemAssembly from '../components/SystemAssembly'
import SolarYieldChart from '../components/SolarYieldChart'
import InstallationSteps from '../components/InstallationSteps'
import { generatePDF } from '../lib/pdf'

// ── Section definitions ───────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'overview',     num: 1, label: 'System Overview',          icon: 'ti-dashboard' },
  { id: 'electrical',   num: 2, label: 'Electrical Design',        icon: 'ti-bolt' },
  { id: 'assembly',     num: 3, label: 'Assembly & Connection',    icon: 'ti-tool' },
  { id: 'energy',       num: 4, label: 'Energy Analysis',          icon: 'ti-chart-bar' },
  { id: 'installation', num: 5, label: 'Installation Roadmap',     icon: 'ti-list-check' },
  { id: 'financial',    num: 6, label: 'Financial Summary',        icon: 'ti-currency-dollar' },
  { id: 'download',     num: 7, label: 'Download',                 icon: 'ti-download' },
]

// ── Animated circular SVG gauge ───────────────────────────────────────────────
function ScoreGauge({ score, grade }) {
  const [anim, setAnim] = useState(0)
  useEffect(() => {
    let start = null
    const dur = 1000
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setAnim(ease)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  const color = score >= 71 ? '#27AE60' : score >= 41 ? '#F5A623' : '#EF4444'
  const R = 38
  const circ = 2 * Math.PI * R
  const offset = circ - (score / 100) * circ * anim

  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r={R} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="48" cy="48" r={R} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score * anim)}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color, opacity: 0.7, marginTop: 3 }}>{grade}</div>
      </div>
    </div>
  )
}

// ── Optimization badge ────────────────────────────────────────────────────────
function Badge({ label, value, ok }) {
  const c = ok ? '#27AE60' : '#F5A623'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: ok ? 'rgba(39,174,96,0.06)' : 'rgba(245,166,35,0.06)',
      border: `0.5px solid ${ok ? 'rgba(39,174,96,0.2)' : 'rgba(245,166,35,0.2)'}`,
      borderRadius: 6, padding: '5px 10px', fontSize: 11, color: c,
    }}>
      <span style={{ fontSize: 13 }}>{ok ? '✓' : '✗'}</span>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}:</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ id, num, title, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 80, marginBottom: '2.5rem' }}>
      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(245,166,35,0.3), rgba(255,255,255,0.04) 60%)', marginBottom: '1.5rem' }} />
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'rgba(245,166,35,0.1)', border: '0.5px solid rgba(245,166,35,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#F5A623',
        }}>{num}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{title}</div>
      </div>
      {children}
    </section>
  )
}

// ── CSS for ToC sidebar ───────────────────────────────────────────────────────
const TOC_CSS = `
.sd-layout{display:flex;gap:0;max-width:1100px;margin:0 auto;padding:0 1.5rem}
.sd-toc{position:sticky;top:80px;width:220px;flex-shrink:0;align-self:flex-start;padding:1rem 0}
.sd-main{flex:1;min-width:0;padding:0 0 3rem}
.sd-toc-link{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:none;background:none;cursor:pointer;width:100%;text-align:left;color:rgba(255,255,255,0.35);font-size:12px;font-weight:600;transition:all .15s ease;border-left:2px solid transparent;margin-bottom:2px}
.sd-toc-link:hover{color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.03)}
.sd-toc-link.active{color:#F5A623;background:rgba(245,166,35,0.06);border-left-color:#F5A623}
.sd-toc-num{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;background:rgba(255,255,255,0.04);flex-shrink:0}
.sd-toc-link.active .sd-toc-num{background:rgba(245,166,35,0.15);color:#F5A623}
@media(max-width:900px){.sd-toc{display:none}.sd-layout{padding:0 1rem}}
`

// ── Main component ────────────────────────────────────────────────────────────
export default function SystemDesign() {
  const location = useLocation()
  const navigate = useNavigate()
  const d = location.state || {}
  const specs = d.specs
  const calcState = d.state
  const products = d.products
  const arrayOpt = d.arrayOpt
  const batteryOpt = d.batteryOpt
  const emScore = d.emScore
  const aiText = d.aiText || ''

  const [activeSection, setActiveSection] = useState('overview')
  const diagramRef = useRef(null)

  // Scroll spy
  useEffect(() => {
    if (!specs) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [specs])

  // SVG export
  const exportSVG = useCallback(() => {
    const svgEl = diagramRef.current?.querySelector('svg')
    if (!svgEl) return
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `solarah-sld-${specs.systemKW}kWp.svg`; a.click()
    URL.revokeObjectURL(url)
  }, [specs])

  if (!specs) {
    return (
      <div style={{ maxWidth: 700, margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#fff' }}>No system design loaded</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>Run the calculator first to generate a system design.</div>
        <button className="btn-primary" onClick={() => navigate('/calculator')}>
          <i className="ti ti-calculator" aria-hidden="true" /> Go to calculator
        </button>
      </div>
    )
  }

  const handlePDF = () => generatePDF(calcState, specs, products, aiText)
  const sector = specs.sector || 'residential'
  const sectorLabel = sector === 'commercial' ? 'Commercial' : sector === 'industrial' ? 'Industrial' : 'Residential'
  const systemType = calcState?.systemType || 'Hybrid (grid-tied + battery backup)'
  const currency = calcState?.currency || 'USD'
  const lat = parseFloat(calcState?.latitude) || 30

  // Shared styles
  const card = { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '1.5rem' }
  const gridRow = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }
  const statCard = { background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.9rem', textAlign: 'center' }
  const statLabel = { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }
  const statVal = { fontSize: 18, fontWeight: 800 }
  const statUnit = { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }
  const roiRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }
  const roiLabel = { fontSize: 13, color: 'rgba(255,255,255,0.55)' }
  const roiVal = { fontSize: 14, fontWeight: 700 }

  return (
    <>
      <style>{TOC_CSS}</style>
      <div className="sd-layout">
        {/* ── Sticky Table of Contents ── */}
        <nav className="sd-toc">
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 12px', marginBottom: 8 }}>
            Contents
          </div>
          {SECTIONS.map(s => (
            <button key={s.id}
              className={`sd-toc-link${activeSection === s.id ? ' active' : ''}`}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="sd-toc-num">{s.num}</span>
              {s.label}
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 12px' }} />
          <button className="sd-toc-link" onClick={() => navigate('/calculator')} style={{ color: 'rgba(255,255,255,0.3)' }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} /> Back to calculator
          </button>
        </nav>

        {/* ── Main content ── */}
        <div className="sd-main">

          {/* Report header */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#F5A623', marginBottom: 6 }}>System design report</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {calcState?.name || 'Your'} — {sectorLabel} solar system
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              {calcState?.region}{calcState?.city ? `, ${calcState.city}` : ''} · {specs.systemKW} kWp · {specs.panels} panels
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 1 — System Overview                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="overview" num={1} title="System Overview">
            {/* Score gauge + key specs */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {/* Left: Score gauge */}
              {emScore && (
                <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '0 0 auto' }}>
                  <ScoreGauge score={emScore.score} grade={emScore.grade} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{emScore.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Energy Management Score</div>
                    {emScore.recommendations.length > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                        {emScore.recommendations.slice(0, 2).map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                            <span style={{ color: '#F5A623' }}>→</span> {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Key specs grid */}
            <div style={{ ...card, marginBottom: '1rem' }}>
              <div style={gridRow}>
                <div style={statCard}>
                  <div style={statLabel}>System size</div>
                  <div style={{ ...statVal, color: '#F5A623' }}>{specs.systemKW} kWp</div>
                  <div style={statUnit}>{specs.panels} × 400W</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Inverter</div>
                  <div style={{ ...statVal, color: '#8B5CF6' }}>{specs.inverterKW} kW</div>
                  <div style={statUnit}>{specs.gridPhase === 'three' ? '3-phase' : 'Hybrid'}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Battery</div>
                  <div style={{ ...statVal, color: specs.batteryKWh > 0 ? '#27AE60' : 'rgba(255,255,255,0.25)' }}>{specs.batteryKWh > 0 ? `${specs.batteryKWh} kWh` : 'None'}</div>
                  <div style={statUnit}>{specs.batteryKWh > 0 ? 'LFP' : 'Grid-tied'}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Sector</div>
                  <div style={statVal}>{sectorLabel}</div>
                  <div style={statUnit}>{systemType.split('(')[0].trim()}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Daily load</div>
                  <div style={statVal}>{specs.dailyKWh}</div>
                  <div style={statUnit}>kWh/day</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Peak sun</div>
                  <div style={{ ...statVal, color: '#F5A623' }}>{specs.peakSun}</div>
                  <div style={statUnit}>hrs/day</div>
                </div>
              </div>
            </div>

            {/* Optimization badges */}
            {arrayOpt && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Badge label="Tilt" value={`${arrayOpt.optimalTilt}°`} ok={arrayOpt.tiltGain > 0} />
                <Badge label="Azimuth" value={`${arrayOpt.optimalAzimuth}°`} ok={true} />
                <Badge label="Shading" value={arrayOpt.shadingLevel || 'None'} ok={!arrayOpt.shadingDerate || arrayOpt.shadingDerate === 0} />
                <Badge label="Temp correction" value={`-${arrayOpt.tempDeratePct}%`} ok={arrayOpt.tempDeratePct < 10} />
                {batteryOpt && batteryOpt.selfConsumptionRate > 0 && (
                  <Badge label="Self-consumption" value={`${batteryOpt.selfConsumptionRate}%`} ok={batteryOpt.selfConsumptionRate >= 60} />
                )}
              </div>
            )}
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 2 — Electrical Design                                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="electrical" num={2} title="Electrical Design">
            <div ref={diagramRef}>
              <SystemDiagram specs={specs} state={calcState} sector={sector} systemType={systemType} products={products} />
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={exportSVG} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)',
                borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600,
                transition: 'all .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5A623'; e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              >
                <i className="ti ti-download" style={{ fontSize: 14 }} /> Download as SVG
              </button>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 3 — Assembly & Connection Guide                             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="assembly" num={3} title="Assembly & Connection Guide">
            <SystemAssembly specs={specs} systemType={systemType} sector={sector} products={products} />
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 4 — Energy Analysis                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="energy" num={4} title="Energy Analysis">
            <SolarYieldChart
              specs={{
                annualKWh: specs.dailyKWh ? specs.dailyKWh * 365 : 7000,
                lifetimeSavings: specs.lifetimeSavings,
                payback: specs.payback,
                annualSavings: specs.annualSavings,
                selfConsumptionRate: batteryOpt?.selfConsumptionRate || 65,
                batteryKWh: specs.batteryKWh,
                offGrid: systemType.toLowerCase().includes('off-grid'),
              }}
              lat={lat}
            />
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 5 — Installation Roadmap                                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="installation" num={5} title="Installation Roadmap">
            <InstallationSteps specs={specs} state={calcState} systemType={systemType} products={products} sector={sector} />
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 6 — Financial Summary                                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="financial" num={6} title="Financial Summary">
            <div style={card}>
              <div style={roiRow}>
                <span style={roiLabel}>Estimated system cost</span>
                <span style={roiVal}>{currency} {specs.systemCost.toLocaleString()}</span>
              </div>
              <div style={roiRow}>
                <span style={roiLabel}>Annual energy savings</span>
                <span style={{ ...roiVal, color: '#27AE60' }}>+ {currency} {specs.energySavings.toLocaleString()}</span>
              </div>
              {specs.demandSavings > 0 && (
                <div style={roiRow}>
                  <span style={roiLabel}>Demand charge savings</span>
                  <span style={{ ...roiVal, color: '#27AE60' }}>+ {currency} {specs.demandSavings.toLocaleString()}</span>
                </div>
              )}
              <div style={roiRow}>
                <span style={roiLabel}>Total annual savings</span>
                <span style={{ ...roiVal, color: '#27AE60' }}>+ {currency} {specs.annualSavings.toLocaleString()}</span>
              </div>
              <div style={roiRow}>
                <span style={roiLabel}>Payback period</span>
                <span style={roiVal}>{specs.payback} years</span>
              </div>
              <div style={roiRow}>
                <span style={roiLabel}>25-year lifetime savings</span>
                <span style={{ ...roiVal, color: '#F5A623' }}>{currency} {specs.lifetimeSavings.toLocaleString()}</span>
              </div>
              <div style={{ ...roiRow, borderBottom: 'none' }}>
                <span style={roiLabel}>CO₂ offset / year</span>
                <span style={roiVal}>{specs.co2PerYear} tonnes</span>
              </div>
            </div>

            {/* AI Analysis */}
            {aiText && (
              <div style={{ ...card, marginTop: '1rem', background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#8B5CF6' }}>✦</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>AI system analysis</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Powered by Claude</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{aiText}</div>
              </div>
            )}
          </Section>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Section 7 — Download                                               */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Section id="download" num={7} title="Download">
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <button onClick={handlePDF} style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', maxWidth: 440, padding: '16px 28px',
                background: 'linear-gradient(135deg, #F5A623 0%, #e69510 100%)',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                color: '#0B1F3A', fontSize: 16, fontWeight: 800, letterSpacing: 0.3,
                boxShadow: '0 4px 24px rgba(245,166,35,0.25)',
                transition: 'all .2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(245,166,35,0.25)' }}
              >
                <i className="ti ti-download" style={{ fontSize: 20 }} />
                Download PDF Report
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
                Includes system specifications, wiring diagram, financial analysis & AI recommendations
              </div>
            </div>

            {/* Secondary actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigate('/engineers')}>
                <i className="ti ti-calendar" aria-hidden="true" /> Book an engineer
              </button>
              <button className="btn-ghost" style={{ justifyContent: 'center' }} onClick={() => navigate('/calculator')}>
                <i className="ti ti-arrow-left" aria-hidden="true" /> Back to calculator
              </button>
            </div>
          </Section>

        </div>
      </div>
    </>
  )
}
