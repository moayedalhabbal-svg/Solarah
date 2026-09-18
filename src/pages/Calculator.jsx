import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountUp } from '../lib/useCountUp'
import { PEAK_SUN, TARIFFS, APPLIANCES, COMMERCIAL_TYPES, INDUSTRIAL_TYPES, calc, getProducts, optimizeArray, optimizeBattery, energyManagementScore } from '../lib/calculator'
import { generatePDF } from '../lib/pdf'
import { saveReport, logAffiliateClick } from '../lib/supabase'
import styles from './Calculator.module.css'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED', 'NGN', 'INR', 'AUD', 'BRL', 'CAD']

const SECTORS = [
  { id: 'residential', icon: '🏠', label: 'Residential', desc: 'Homes & apartments' },
  { id: 'commercial', icon: '🏢', label: 'Commercial', desc: 'Offices, hotels, retail' },
  { id: 'industrial', icon: '🏭', label: 'Industrial', desc: 'Factories & warehouses' },
]

export default function Calculator({ user }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(-1) // -1 = sector select
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [specs, setSpecs] = useState(null)
  const [products, setProducts] = useState(null)
  const [arrayOpt, setArrayOpt] = useState(null)
  const [batteryOpt, setBatteryOpt] = useState(null)
  const [emScore, setEmScore] = useState(null)
  const [state, setState] = useState({
    name: user?.user_metadata?.full_name || '',
    sector: '', region: '', city: '', tariff: 0.12, currency: 'USD',
    latitude: '', longitude: '',
    selApps: [], appHrs: {}, bill: 0,
    roofArea: 30, budget: 'medium', systemType: 'Hybrid (grid-tied + battery backup)',
    shading: 'none',
    // Commercial
    commercialType: '', floorArea: 500, gridPhase: 'three',
    // Industrial
    industrialType: '', shifts: '1',
  })

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))
  const sector = state.sector

  // Animated result numbers (count up from 0 when step 3 renders)
  const _sysKW   = useCountUp(specs ? specs.systemKW : 0, 800, 1)
  const _invKW   = useCountUp(specs ? specs.inverterKW : 0, 800, 1)
  const _batKWh  = useCountUp(specs ? specs.batteryKWh : 0, 800, 1)
  const _annSav  = useCountUp(specs ? specs.annualSavings : 0, 800, 0)
  const _sysCost = useCountUp(specs ? specs.systemCost : 0, 800, 0)
  const _eneSav  = useCountUp(specs ? specs.energySavings : 0, 800, 0)
  const _demSav  = useCountUp(specs ? (specs.demandSavings || 0) : 0, 800, 0)
  const _payback = useCountUp(specs ? specs.payback : 0, 800, 1)
  const _lifeSav = useCountUp(specs ? specs.lifetimeSavings : 0, 800, 0)
  const _co2     = useCountUp(specs ? specs.co2PerYear : 0, 800, 1)

  const next = () => {
    if (step === -1 && !state.sector) { alert('Please select a sector.'); return }
    if (step === 0 && !state.region) { alert('Please select your region.'); return }
    const newStep = step + 1
    setStep(newStep)
    if (newStep === 3) {
      const s = calc(state)
      const arrOpt = optimizeArray({ ...state, _panels: s.panels })
      const batOpt = optimizeBattery(state, s)
      const score = energyManagementScore(s, state, arrOpt, batOpt)
      const p = getProducts(s, state.sector)
      setSpecs(s)
      setProducts(p)
      setArrayOpt(arrOpt)
      setBatteryOpt(batOpt)
      setEmScore(score)
      runAI(s, () => {
        if (user) saveReport(user.id, { ...state, ...s, aiText })
      })
    }
  }
  const back = () => setStep(s => Math.max(s - 1, step === 0 ? -1 : 0))

  async function runAI(s, onComplete) {
    setAiLoading(true)
    setAiText('')
    const sectorLabel = sector === 'commercial' ? 'business' : sector === 'industrial' ? 'facility' : 'homeowner'
    const prompt = `You are a solar energy advisor. Write a concise 3-paragraph analysis (~120 words total) for this ${sectorLabel}. Use their exact numbers. Be warm, professional, and specific.

Customer: ${state.name || 'Client'} | Location: ${state.region}${state.city ? ', ' + state.city : ''} | Sector: ${sector}
System: ${s.systemKW} kWp, ${s.panels} panels, ${s.inverterKW}kW inverter, ${s.batteryKWh}kWh battery
Daily load: ${s.dailyKWh} kWh | Peak sun: ${s.peakSun} hrs/day | CO₂ offset: ${s.co2PerYear} t/yr
Cost: ${state.currency} ${s.systemCost.toLocaleString()} | Annual savings: ${state.currency} ${s.annualSavings.toLocaleString()} | Payback: ${s.payback} yrs | 25yr savings: ${state.currency} ${s.lifetimeSavings.toLocaleString()}

Paragraph 1: system suitability. Paragraph 2: financial outlook. Paragraph 3: next steps. No headers.`

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stream: true,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = '', full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6); if (d === '[DONE]') break
          try {
            const j = JSON.parse(d)
            const textDelta = j.candidates?.[0]?.content?.parts?.[0]?.text
            if (textDelta) {
              full += textDelta
              setAiText(full)
            }
          } catch { }
        }
      }
    } catch {
      setAiText(`Your ${s.systemKW} kWp system is well-suited for ${state.region}, where ${s.peakSun} peak sun hours per day deliver strong generation potential. The ${s.panels}-panel array with ${s.batteryKWh} kWh of storage will cover your ${s.dailyKWh} kWh daily load reliably.\n\nFinancially, you're looking at a ${s.payback}-year payback and ${state.currency} ${s.lifetimeSavings.toLocaleString()} in 25-year savings — an excellent return at current electricity tariffs. You'll also offset ${s.co2PerYear} tonnes of CO₂ annually.\n\nBook a virtual consultation with a Solarah engineer to confirm your roof orientation and finalise the design before placing any orders.`)
    }
    setAiLoading(false)
    if (onComplete) onComplete()
  }

  const handleAffiliate = (product, key) => {
    logAffiliateClick({ userId: user?.id, productId: key, productName: product.name, supplier: product.supplier })
    window.open(product.link, '_blank')
  }

  const handlePDF = () => generatePDF(state, specs, products, aiText)

  const stepNames = sector === 'residential'
    ? ['Location', 'Consumption', 'Preferences', 'Your report']
    : ['Location', 'Load profile', 'Preferences', 'Your report']
  const progress = ((step + 2) / 5) * 100

  return (
    <div className={styles.wrap}>
      {/* Step header */}
      {step >= 0 && (
        <div className={styles.header}>
          <div className={styles.stepLabels}>
            {stepNames.map((l, i) => (
              <div key={l} className={`${styles.stepLabel} ${i === step ? styles.active : i < step ? styles.done : ''}`}>
                <span className={styles.stepNum}>{i < step ? '✓' : i + 1}</span> {l}
              </div>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: progress + '%' }} />
          </div>
        </div>
      )}

      {/* Step -1 — Sector Selection */}
      {step === -1 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>What type of project is this?</div>
          <div className={styles.cardSub}>Select your sector — the calculator adapts to your specific needs.</div>
          <div className={styles.budgetGrid}>
            {SECTORS.map(s => (
              <div key={s.id}
                className={`${styles.budgetTile} ${state.sector === s.id ? styles.budgetOn : ''}`}
                onClick={() => set('sector', s.id)}
                style={{ textAlign: 'center', padding: '1.5rem 1rem' }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                <div className={styles.appName}>{s.label}</div>
                <div className={styles.appWatts}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div className={styles.btnRow}>
            <span />
            <button className="btn-primary" onClick={next}>Next: location <i className="ti ti-arrow-right" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* Step 0 — Location */}
      {step === 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Where is this project?</div>
          <div className={styles.cardSub}>We use your region for real solar irradiance data and local electricity tariffs.</div>
          <div className="field">
            <label>{sector === 'residential' ? 'Your name' : 'Company / project name'}</label>
            <input placeholder={sector === 'residential' ? 'e.g. Ahmed Al-Rashid' : 'e.g. Grand Hyatt Dubai'} value={state.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Region</label>
            <select value={state.region} onChange={e => {
              set('region', e.target.value)
              set('tariff', TARIFFS[e.target.value] || 0.12)
            }}>
              <option value="">— select your region —</option>
              {Object.keys(PEAK_SUN).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>City (optional)</label>
            <input placeholder="e.g. Cairo, Berlin, Lagos..." value={state.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Latitude</label>
              <input type="number" step="0.01" placeholder="e.g. 30.04" value={state.latitude} onChange={e => set('latitude', e.target.value)} />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input type="number" step="0.01" placeholder="e.g. 31.24" value={state.longitude} onChange={e => set('longitude', e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Electricity tariff ($/kWh)</label>
              <input type="number" step="0.01" value={state.tariff} onChange={e => set('tariff', parseFloat(e.target.value) || 0.12)} />
            </div>
            <div className="field">
              <label>Currency</label>
              <select value={state.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.btnRow}>
            <button className="btn-secondary" onClick={back}><i className="ti ti-arrow-left" aria-hidden="true" /> Back</button>
            <button className="btn-primary" onClick={next}>Next: {sector === 'residential' ? 'consumption' : 'load profile'} <i className="ti ti-arrow-right" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* Step 1 — Consumption / Load Profile */}
      {step === 1 && (
        <div className={styles.card}>
          {sector === 'residential' && (
            <>
              <div className={styles.cardTitle}>What do you power?</div>
              <div className={styles.cardSub}>Select your appliances — or just enter your monthly bill below.</div>
              <div className={styles.appGrid}>
                {APPLIANCES.map(a => (
                  <div key={a.id}
                    className={`${styles.appTile} ${state.selApps.includes(a.id) ? styles.appOn : ''}`}
                    onClick={() => {
                      const sel = state.selApps.includes(a.id)
                        ? state.selApps.filter(x => x !== a.id)
                        : [...state.selApps, a.id]
                      set('selApps', sel)
                    }}>
                    <div className={styles.appName}>{a.name}</div>
                    <div className={styles.appWatts}>{a.watts}W typical</div>
                  </div>
                ))}
              </div>
              {state.selApps.length > 0 && (
                <div className={styles.sliders}>
                  <div className={styles.slidersTitle}>Hours used per day</div>
                  {state.selApps.map(id => {
                    const a = APPLIANCES.find(x => x.id === id)
                    const hrs = state.appHrs[id] ?? a.defaultHrs
                    return (
                      <div key={id} className={styles.sliderRow}>
                        <span className={styles.sliderLabel}>{a.name}</span>
                        <input type="range" min="1" max="24" step="1" value={hrs}
                          onChange={e => set('appHrs', { ...state.appHrs, [id]: parseInt(e.target.value) })} />
                        <span className={styles.sliderVal}>{hrs}h</span>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="field">
                <label>Or: monthly electricity bill (in your currency)</label>
                <input type="number" placeholder="e.g. 120" value={state.bill || ''} onChange={e => set('bill', parseFloat(e.target.value) || 0)} />
              </div>
            </>
          )}

          {sector === 'commercial' && (
            <>
              <div className={styles.cardTitle}>What type of business?</div>
              <div className={styles.cardSub}>Select your business type — we'll estimate your load profile automatically.</div>
              <div className={styles.appGrid}>
                {COMMERCIAL_TYPES.map(b => (
                  <div key={b.id}
                    className={`${styles.appTile} ${state.commercialType === b.id ? styles.appOn : ''}`}
                    onClick={() => set('commercialType', b.id)}>
                    <div className={styles.appName}>{b.name}</div>
                    <div className={styles.appWatts}>{b.dailyKWh} kWh/day</div>
                  </div>
                ))}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Floor area (m²)</label>
                  <input type="number" value={state.floorArea} onChange={e => set('floorArea', parseInt(e.target.value) || 500)} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Used to estimate usable rooftop area</div>
                </div>
                <div className="field">
                  <label>Grid connection</label>
                  <select value={state.gridPhase} onChange={e => set('gridPhase', e.target.value)}>
                    <option value="single">Single-phase</option>
                    <option value="three">Three-phase</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {sector === 'industrial' && (
            <>
              <div className={styles.cardTitle}>What type of industry?</div>
              <div className={styles.cardSub}>Select your industry — we'll calculate load profile with shift scheduling.</div>
              <div className={styles.appGrid}>
                {INDUSTRIAL_TYPES.map(ind => (
                  <div key={ind.id}
                    className={`${styles.appTile} ${state.industrialType === ind.id ? styles.appOn : ''}`}
                    onClick={() => set('industrialType', ind.id)}>
                    <div className={styles.appName}>{ind.name}</div>
                    <div className={styles.appWatts}>{ind.dailyKWh} kWh/day · {ind.peakKW} kW peak</div>
                  </div>
                ))}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Operational shifts</label>
                  <select value={state.shifts} onChange={e => set('shifts', e.target.value)}>
                    <option value="1">1 shift (8 hours)</option>
                    <option value="2">2 shifts (16 hours)</option>
                    <option value="3">3 shifts (24 hours)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Grid connection</label>
                  <select value={state.gridPhase} onChange={e => set('gridPhase', e.target.value)}>
                    <option value="three">Three-phase (standard)</option>
                    <option value="single">Single-phase</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className={styles.btnRow}>
            <button className="btn-secondary" onClick={back}><i className="ti ti-arrow-left" aria-hidden="true" /> Back</button>
            <button className="btn-primary" onClick={next}>Next: preferences <i className="ti ti-arrow-right" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* Step 2 — Preferences */}
      {step === 2 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>System preferences</div>
          <div className={styles.cardSub}>A few final details to fine-tune your design.</div>
          {sector === 'residential' && (
            <div className="field">
              <label>Available roof / installation area</label>
              <div className={styles.sliderRow}>
                <input type="range" min="5" max="200" step="5" value={state.roofArea}
                  onChange={e => set('roofArea', parseInt(e.target.value))} />
                <span className={styles.sliderVal}>{state.roofArea} m²</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>~2.5 m² needed per 400W panel</div>
            </div>
          )}
          <div className="field">
            <label>Budget tier</label>
            <div className={styles.budgetGrid}>
              {[['economy', 'Economy', 'Best value'], ['medium', 'Standard', 'Best sellers'], ['premium', 'Premium', 'Top efficiency']].map(([v, l, d]) => (
                <div key={v} className={`${styles.budgetTile} ${state.budget === v ? styles.budgetOn : ''}`}
                  onClick={() => set('budget', v)}>
                  <div className={styles.appName}>{l}</div>
                  <div className={styles.appWatts}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>System type</label>
              <select value={state.systemType} onChange={e => set('systemType', e.target.value)}>
                <option>Hybrid (grid-tied + battery backup)</option>
                <option>Off-grid (fully independent)</option>
                <option>Grid-tied only (no battery)</option>
              </select>
            </div>
            <div className="field">
              <label>Shading level</label>
              <select value={state.shading} onChange={e => set('shading', e.target.value)}>
                <option value="none">None</option>
                <option value="minimal">Minimal (-5%)</option>
                <option value="moderate">Moderate (-15%)</option>
                <option value="heavy">Heavy (-30%)</option>
              </select>
            </div>
          </div>
          <div className={styles.btnRow}>
            <button className="btn-secondary" onClick={back}><i className="ti ti-arrow-left" aria-hidden="true" /> Back</button>
            <button className="btn-primary" onClick={next}><i className="ti ti-sparkles" aria-hidden="true" /> Generate my report</button>
          </div>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 3 && specs && (
        <div>
          {/* System specs */}
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <div className={styles.cardTitle}>Your system design</div>
            <div className={styles.resGrid}>
              <div className={styles.resCard}><div className={styles.resLabel}>System size</div><div className={styles.resVal}>{_sysKW} kWp</div><div className={styles.resUnit}>{specs.panels} × 400W panels</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Inverter</div><div className={styles.resVal}>{_invKW} kW</div><div className={styles.resUnit}>{specs.gridPhase === 'three' ? '3-phase' : 'Hybrid'} MPPT</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Battery</div><div className={styles.resVal}>{_batKWh} kWh</div><div className={styles.resUnit}>{specs.batteryKWh > 0 ? `~${Math.round(specs.batteryKWh / specs.dailyKWh * 10) / 10}d backup` : 'No battery'}</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Annual savings</div><div className={`${styles.resVal} text-green`} style={{ fontSize: 18 }}>{state.currency} {Number(_annSav).toLocaleString()}</div><div className={styles.resUnit}>at {state.tariff}/kWh</div></div>
            </div>
          </div>

          {/* Energy Management Score */}
          {emScore && (
            <div className={styles.card} style={{ marginBottom: '1rem' }}>
              <div className={styles.sectionHead}>Energy management score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: emScore.score >= 70 ? 'rgba(39,174,96,0.15)' : 'rgba(245,166,35,0.15)',
                  border: `2px solid ${emScore.score >= 70 ? '#27AE60' : '#F5A623'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: emScore.score >= 70 ? '#27AE60' : '#F5A623',
                }}>{emScore.score}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{emScore.label} ({emScore.grade})</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Based on your system configuration</div>
                </div>
              </div>
              {emScore.recommendations.length > 0 && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'rgba(255,255,255,0.65)' }}>Top recommendations:</div>
                  {emScore.recommendations.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                      <span style={{ color: '#F5A623' }}>→</span> {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Optimization outputs */}
          {arrayOpt && (
            <div className={styles.card} style={{ marginBottom: '1rem' }}>
              <div className={styles.sectionHead}>Engineering optimization</div>
              <div className={styles.resGrid}>
                <div className={styles.resCard}><div className={styles.resLabel}>Optimal tilt</div><div className={styles.resVal}>{arrayOpt.optimalTilt}°</div><div className={styles.resUnit}>+{arrayOpt.tiltGain}% vs flat</div></div>
                <div className={styles.resCard}><div className={styles.resLabel}>Azimuth</div><div className={styles.resVal}>{arrayOpt.optimalAzimuth}°</div><div className={styles.resUnit}>{arrayOpt.azimuthNote.split(' — ')[0]}</div></div>
                <div className={styles.resCard}><div className={styles.resLabel}>Temp derate</div><div className={styles.resVal}>-{arrayOpt.tempDeratePct}%</div><div className={styles.resUnit}>ΔT +{arrayOpt.deltaT}°C</div></div>
                {batteryOpt && batteryOpt.batteryLifeYears > 0 && (
                  <div className={styles.resCard}><div className={styles.resLabel}>Battery life</div><div className={styles.resVal}>{batteryOpt.batteryLifeYears} yr</div><div className={styles.resUnit}>{batteryOpt.expectedCycles} cycles</div></div>
                )}
              </div>
              {specs.powerFactorWarning && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#E74C3C', background: 'rgba(231,76,60,0.08)', border: '0.5px solid rgba(231,76,60,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                  ⚠️ Power factor correction capacitor bank recommended for this industrial load type.
                </div>
              )}
              {specs.gridFeasibilityRequired && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#F5A623', background: 'rgba(245,166,35,0.08)', border: '0.5px solid rgba(245,166,35,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                  ⚡ System exceeds 200 kWp — grid feasibility study and DNO approval required.
                </div>
              )}
            </div>
          )}

          {/* Products */}
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <div className={styles.sectionHead}>Recommended components</div>
            {Object.entries(products).filter(([, p]) => p !== null).map(([key, p]) => (
              <div key={key} className={styles.product}>
                <div className={styles.prodIcon}><i className={`ti ${key === 'panels' ? 'ti-solar-panel' : key === 'inverter' ? 'ti-bolt' : 'ti-battery-charging'}`} aria-hidden="true" /></div>
                <div className={styles.prodInfo}>
                  <div className={styles.prodName}>{p.name}</div>
                  <div className={styles.prodSpec}>{p.spec}</div>
                  {p.note && <div style={{ fontSize: 11, color: '#F5A623', marginTop: 2 }}>⚡ {p.note}</div>}
                </div>
                <button className={styles.buyBtn} onClick={() => handleAffiliate(p, key)}>Buy ↗</button>
              </div>
            ))}
            <div className={styles.commNote}><i className="ti ti-info-circle" aria-hidden="true" /> Solarah earns a small commission on purchases — at no extra cost to you.</div>
          </div>

          {/* Financial summary */}
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <div className={styles.sectionHead}>Financial summary</div>
            {[
              ['Estimated system cost', `${state.currency} ${Number(_sysCost).toLocaleString()}`, ''],
              ['Annual energy savings', `+ ${state.currency} ${Number(_eneSav).toLocaleString()}`, 'text-green'],
              ...(specs.demandSavings > 0 ? [['Annual demand charge savings', `+ ${state.currency} ${Number(_demSav).toLocaleString()}`, 'text-green']] : []),
              ['Total annual savings', `+ ${state.currency} ${Number(_annSav).toLocaleString()}`, 'text-green'],
              ['Payback period', `${_payback} years`, ''],
              ['25-year lifetime savings', `${state.currency} ${Number(_lifeSav).toLocaleString()}`, 'text-amber'],
              ['CO₂ offset / year', `${_co2} tonnes`, ''],
            ].map(([label, val, cls]) => (
              <div key={label} className={styles.roiRow}>
                <span className={styles.roiLabel}>{label}</span>
                <span className={`${styles.roiVal} ${cls}`}>{val}</span>
              </div>
            ))}
          </div>

          {/* AI analysis */}
          <div className={styles.aiBox}>
            <div className={styles.aiHeader}>
              <div className={styles.aiIcon}><i className="ti ti-sparkles" aria-hidden="true" /></div>
              <div>
                <div className={styles.aiTitle}>AI system analysis</div>
                <div className={styles.aiSub}>Powered by Claude · Generated for your exact inputs</div>
              </div>
            </div>
            {aiLoading && !aiText
              ? <div className={styles.aiLoading}><span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} /><span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Generating your analysis...</span></div>
              : <div className={styles.aiText}>{aiText}{aiLoading && <span className={styles.cursor} />}</div>
            }
          </div>

          {/* Actions */}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={() => navigate('/system-design', { state: { specs, state: state, products, arrayOpt, batteryOpt, emScore, aiText } })}>
            <i className="ti ti-layout" aria-hidden="true" /> View full system design
          </button>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, background: 'transparent', border: '0.5px solid rgba(245,166,35,0.4)', color: '#F5A623' }} onClick={handlePDF}>
            <i className="ti ti-download" aria-hidden="true" /> Download PDF report
          </button>
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={() => navigate('/engineers')}>
            <i className="ti ti-calendar" aria-hidden="true" /> Book an engineer consultation
          </button>
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStep(-1); setSpecs(null); setAiText('') }}>
            <i className="ti ti-refresh" aria-hidden="true" /> Start over
          </button>
        </div>
      )}
    </div>
  )
}
