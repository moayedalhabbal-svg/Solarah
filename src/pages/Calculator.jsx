import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PEAK_SUN, TARIFFS, APPLIANCES, calc, getProducts } from '../lib/calculator'
import { generatePDF } from '../lib/pdf'
import { saveReport, logAffiliateClick } from '../lib/supabase'
import styles from './Calculator.module.css'

const CURRENCIES = ['USD','EUR','GBP','EGP','SAR','AED','NGN','INR','AUD','BRL','CAD']

export default function Calculator({ user }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [specs, setSpecs] = useState(null)
  const [products, setProducts] = useState(null)
  const [state, setState] = useState({
    name: user?.user_metadata?.full_name || '',
    region: '', city: '', tariff: 0.12, currency: 'USD',
    selApps: [], appHrs: {}, bill: 0,
    roofArea: 30, budget: 'medium', systemType: 'Hybrid (grid-tied + battery backup)',
  })

  const set = (key, val) => setState(prev => ({ ...prev, [key]: val }))

  const next = () => {
    if (step === 0 && !state.region) { alert('Please select your region.'); return }
    const newStep = step + 1
    setStep(newStep)
    if (newStep === 3) {
      const s = calc(state)
      const p = getProducts(s)
      setSpecs(s)
      setProducts(p)
      runAI(s)
      if (user) saveReport(user.id, { ...state, ...s, aiText })
    }
  }
  const back = () => setStep(s => Math.max(s - 1, 0))

  async function runAI(s) {
    setAiLoading(true)
    setAiText('')
    const prompt = `You are a solar energy advisor. Write a concise 3-paragraph analysis (~120 words total) for this homeowner. Use their exact numbers. Be warm, professional, and specific.

Customer: ${state.name || 'Homeowner'} | Location: ${state.region}${state.city ? ', ' + state.city : ''}
System: ${s.systemKW} kWp, ${s.panels} panels, ${s.inverterKW}kW inverter, ${s.batteryKWh}kWh battery
Daily load: ${s.dailyKWh} kWh | Peak sun: ${s.peakSun} hrs/day | CO₂ offset: ${s.co2PerYear} t/yr
Cost: ${state.currency} ${s.systemCost.toLocaleString()} | Annual savings: ${state.currency} ${s.annualSavings.toLocaleString()} | Payback: ${s.payback} yrs | 25yr savings: ${state.currency} ${s.lifetimeSavings.toLocaleString()}

Paragraph 1: system suitability. Paragraph 2: financial outlook. Paragraph 3: next steps. No headers.`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 300, stream: true,
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
            if (j.type === 'content_block_delta' && j.delta?.text) {
              full += j.delta.text
              setAiText(full)
            }
          } catch {}
        }
      }
    } catch {
      setAiText(`Your ${s.systemKW} kWp system is well-suited for ${state.region}, where ${s.peakSun} peak sun hours per day deliver strong generation potential. The ${s.panels}-panel array with ${s.batteryKWh} kWh of storage will cover your ${s.dailyKWh} kWh daily load reliably.\n\nFinancially, you're looking at a ${s.payback}-year payback and ${state.currency} ${s.lifetimeSavings.toLocaleString()} in 25-year savings — an excellent return at current electricity tariffs. You'll also offset ${s.co2PerYear} tonnes of CO₂ annually.\n\nBook a virtual consultation with a Solarah engineer to confirm your roof orientation and finalise the design before placing any orders.`)
    }
    setAiLoading(false)
  }

  const handleAffiliate = (product, key) => {
    logAffiliateClick({ userId: user?.id, productId: key, productName: product.name, supplier: product.supplier })
    window.open(product.link, '_blank')
  }

  const handlePDF = () => generatePDF(state, specs, products, aiText)

  const progress = ((step + 1) / 4) * 100

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.stepLabels}>
          {['Location','Consumption','Preferences','Your report'].map((l, i) => (
            <div key={l} className={`${styles.stepLabel} ${i === step ? styles.active : i < step ? styles.done : ''}`}>
              <span className={styles.stepNum}>{i < step ? '✓' : i + 1}</span> {l}
            </div>
          ))}
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: progress + '%' }} />
        </div>
      </div>

      {/* Step 0 — Location */}
      {step === 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Where are you located?</div>
          <div className={styles.cardSub}>We use your region for real solar irradiance data and local electricity tariffs.</div>
          <div className="field">
            <label>Your name</label>
            <input placeholder="e.g. Ahmed Al-Rashid" value={state.name} onChange={e => set('name', e.target.value)} />
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
            <span />
            <button className="btn-primary" onClick={next}>Next: consumption <i className="ti ti-arrow-right" aria-hidden="true" /></button>
          </div>
        </div>
      )}

      {/* Step 1 — Consumption */}
      {step === 1 && (
        <div className={styles.card}>
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
          <div className="field">
            <label>Available roof / installation area</label>
            <div className={styles.sliderRow}>
              <input type="range" min="5" max="200" step="5" value={state.roofArea}
                onChange={e => set('roofArea', parseInt(e.target.value))} />
              <span className={styles.sliderVal}>{state.roofArea} m²</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>~2.5 m² needed per 400W panel</div>
          </div>
          <div className="field">
            <label>Budget tier</label>
            <div className={styles.budgetGrid}>
              {[['economy','Economy','Best value'],['medium','Standard','Best sellers'],['premium','Premium','Top efficiency']].map(([v, l, d]) => (
                <div key={v} className={`${styles.budgetTile} ${state.budget === v ? styles.budgetOn : ''}`}
                  onClick={() => set('budget', v)}>
                  <div className={styles.appName}>{l}</div>
                  <div className={styles.appWatts}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="field">
            <label>System type</label>
            <select value={state.systemType} onChange={e => set('systemType', e.target.value)}>
              <option>Hybrid (grid-tied + battery backup)</option>
              <option>Off-grid (fully independent)</option>
              <option>Grid-tied only (no battery)</option>
            </select>
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
              <div className={styles.resCard}><div className={styles.resLabel}>System size</div><div className={styles.resVal}>{specs.systemKW} kWp</div><div className={styles.resUnit}>{specs.panels} × 400W panels</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Inverter</div><div className={styles.resVal}>{specs.inverterKW} kW</div><div className={styles.resUnit}>Hybrid MPPT</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Battery</div><div className={styles.resVal}>{specs.batteryKWh} kWh</div><div className={styles.resUnit}>~{Math.round(specs.batteryKWh / specs.dailyKWh * 10) / 10}d backup</div></div>
              <div className={styles.resCard}><div className={styles.resLabel}>Annual savings</div><div className={`${styles.resVal} text-green`} style={{ fontSize: 18 }}>{state.currency} {specs.annualSavings.toLocaleString()}</div><div className={styles.resUnit}>at {state.tariff}/kWh</div></div>
            </div>
          </div>

          {/* Products */}
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <div className={styles.sectionHead}>Recommended components</div>
            {Object.entries(products).map(([key, p]) => (
              <div key={key} className={styles.product}>
                <div className={styles.prodIcon}><i className={`ti ${key === 'panels' ? 'ti-solar-panel' : key === 'inverter' ? 'ti-bolt' : 'ti-battery-charging'}`} aria-hidden="true" /></div>
                <div className={styles.prodInfo}>
                  <div className={styles.prodName}>{p.name}</div>
                  <div className={styles.prodSpec}>{p.spec}</div>
                </div>
                <button className={styles.buyBtn} onClick={() => handleAffiliate(p, key)}>
                  Buy ↗
                </button>
              </div>
            ))}
            <div className={styles.commNote}><i className="ti ti-info-circle" aria-hidden="true" /> Solarah earns a small commission on purchases — at no extra cost to you.</div>
          </div>

          {/* Financial summary */}
          <div className={styles.card} style={{ marginBottom: '1rem' }}>
            <div className={styles.sectionHead}>Financial summary</div>
            {[
              ['Estimated system cost',    `${state.currency} ${specs.systemCost.toLocaleString()}`,      ''],
              ['Annual savings',           `+ ${state.currency} ${specs.annualSavings.toLocaleString()}`, 'text-green'],
              ['Payback period',           `${specs.payback} years`,                                      ''],
              ['25-year lifetime savings', `${state.currency} ${specs.lifetimeSavings.toLocaleString()}`, 'text-amber'],
              ['CO₂ offset / year',        `${specs.co2PerYear} tonnes`,                                  ''],
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
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={handlePDF}>
            <i className="ti ti-download" aria-hidden="true" /> Download PDF report
          </button>
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }} onClick={() => navigate('/engineers')}>
            <i className="ti ti-calendar" aria-hidden="true" /> Book an engineer consultation
          </button>
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setStep(0); setSpecs(null); setAiText('') }}>
            <i className="ti ti-refresh" aria-hidden="true" /> Start over
          </button>
        </div>
      )}
    </div>
  )
}
