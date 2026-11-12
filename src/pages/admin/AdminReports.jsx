import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import SystemDiagram from '../../components/SystemDiagram'
import { generatePDF } from '../../lib/pdf'
import { getReportDesign } from '../../lib/designConsumers'

export default function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [sector, setSector] = useState('All')
  const [region, setRegion] = useState('All')
  const [sizeMax, setSizeMax] = useState(1000)
  
  const [selectedReport, setSelectedReport] = useState(null)

  const loadReports = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [])

  // Filtered
  const filtered = reports.filter(r => {
    const design = getReportDesign(r, 'admin-report')
    return (
      (sector === 'All' || r.sector === sector) &&
      (region === 'All' || (r.region || '').includes(region) || region === (r.region || 'Unknown')) &&
      (design.systemKW || 0) <= sizeMax
    )
  })

  const handleExport = () => {
    const csv = [
      ['ID', 'User', 'Sector', 'Size kWp', 'Region', 'City', 'Cost USD', 'Savings', 'Savings Currency', 'Created At'],
      ...filtered.map(r => {
        const design = getReportDesign(r, 'admin-report')
        return [
          r.id, r.profiles?.full_name || 'Unknown', r.sector, design.systemKW, r.region, r.city, design.systemCost, design.annualSavings, design.savingsCurrency || 'USD', r.created_at
        ]
      })
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'solarah_reports.csv'; a.click()
  }

  const handlePDF = async (e, report) => {
    e.stopPropagation()
    const design = getReportDesign(report, 'admin-report')
    if (design.reportSource !== 'recomputed') {
      alert('This report lacks current-version reproducible inputs; regenerate it from the calculator before exporting a PDF.')
      return
    }
    await generatePDF(report.design_inputs, design, null, report.ai_analysis)
  }

  const btnStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13, cursor: 'pointer' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 6, color: '#fff', fontSize: 13 }
  const selectedDesign = selectedReport ? getReportDesign(selectedReport, 'admin-report') : null

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={sector} onChange={e => setSector(e.target.value)} style={inputStyle}>
            <option value="All">All Sectors</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
          <select value={region} onChange={e => setRegion(e.target.value)} style={inputStyle}>
            <option value="All">All Regions</option>
            {Array.from(new Set(reports.map(r => r.region || 'Unknown'))).map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span>Max Size (kWp):</span>
            <input type="range" min="0" max="1000" step="10" value={sizeMax} onChange={e => setSizeMax(Number(e.target.value))} />
            <span>{sizeMax === 1000 ? '1000+' : sizeMax}</span>
          </div>
        </div>
        <button onClick={handleExport} style={btnStyle}><i className="ti ti-download" /> Export CSV</button>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', overflowX: 'auto' }}>
        {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading reports...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Sector</th>
                <th style={{ padding: '12px 16px' }}>Size</th>
                <th style={{ padding: '12px 16px' }}>Location</th>
                <th style={{ padding: '12px 16px' }}>Financials (USD)</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const design = getReportDesign(r, 'admin-report')
                return (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setSelectedReport(r)}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.profiles?.full_name || 'Anonymous'}</td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{r.sector}</td>
                  <td style={{ padding: '12px 16px' }}>{design.systemKW ?? '—'} kWp<br/><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{design.batteryKWh ?? '—'} kWh batt</span></td>
                  <td style={{ padding: '12px 16px' }}>{r.city}<br/><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.region}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#10B981' }}>USD {Math.round(design.systemCost || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{design.paybackStatus === 'currency_mismatch' ? 'Payback unavailable: currency mismatch' : design.payback == null ? 'No payback / unavailable' : `${design.payback}y payback`}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={(e) => handlePDF(e, r)} style={{ ...btnStyle, padding: '4px 8px', color: '#F5A623', borderColor: 'rgba(245,166,35,0.3)' }} title="Regenerate PDF">
                      <i className="ti ti-file-type-pdf" />
                    </button>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over */}
      {selectedReport && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setSelectedReport(null)} />
          <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 600, 
            background: '#0B1F3A', borderLeft: '1px solid rgba(255,255,255,0.1)', 
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Report Details</h2>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: 13 }}>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>User:</span> {selectedReport.profiles?.full_name || 'Anonymous'}</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Sector:</span> {selectedReport.sector}</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>System Size:</span> {selectedDesign.systemKW ?? '—'} kWp</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Daily Load:</span> {selectedDesign.dailyKWh ?? '—'} kWh</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Panels:</span> {selectedDesign.panels ?? '—'}</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Battery:</span> {selectedDesign.batteryKWh ?? '—'} kWh</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Cost (USD):</span> USD {selectedDesign.systemCost?.toLocaleString() ?? '—'}</div>
                  <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Savings/yr ({selectedDesign.savingsCurrency || 'USD'}):</span> {selectedDesign.savingsCurrency || 'USD'} {selectedDesign.annualSavings?.toLocaleString() ?? '—'}</div>
                </div>
              </div>
              {selectedDesign.reportSource !== 'recomputed' && <div style={{ marginBottom: '1rem', color: '#F5A623', fontSize: 12 }}>Saved snapshot: original inputs are missing or use a different assumptions version; values are not recalculated.</div>}

              <h3 style={{ fontSize: 14, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem' }}>System Diagram</h3>
              <div style={{ background: '#fff', borderRadius: 8, padding: 16, height: 300, overflow: 'hidden' }}>
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}>
                  <SystemDiagram
                    specs={selectedDesign}
                    state={selectedDesign.reportSource === 'recomputed' ? selectedReport.design_inputs : undefined}
                    sector={selectedReport.sector}
                  />
                </div>
              </div>

              {selectedReport.ai_analysis && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontSize: 14, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1rem' }}>AI Analysis</h3>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.ai_analysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
