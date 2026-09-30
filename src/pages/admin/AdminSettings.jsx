import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*')
    const s = {}
    if (data) {
      data.forEach(item => {
        s[item.key] = item.value
      })
    }
    // Set defaults if missing
    if (!s.maintenance_mode) s.maintenance_mode = 'false'
    if (!s.allow_signups) s.allow_signups = 'true'
    if (!s.default_currency) s.default_currency = 'USD'
    if (!s.default_electricity_price) s.default_electricity_price = '0.12'
    if (!s.default_co2_factor) s.default_co2_factor = '0.45'
    if (!s.panel_degradation_factor) s.panel_degradation_factor = '0.005'
    
    setSettings(s)
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const updates = Object.entries(settings).map(([key, value]) => ({ key, value }))
    try {
      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' })
      if (error) throw error
      alert('Settings saved successfully.')
    } catch (err) {
      alert('Error saving settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDangerAction = async (action) => {
    if (action === 'clear_waitlist') {
      if (window.prompt('Type "DELETE ALL" to confirm clearing the entire waitlist:') === 'DELETE ALL') {
        await supabase.from('waitlist').delete().neq('id', 'dummy')
        alert('Waitlist cleared.')
      }
    } else if (action === 'reset_clicks') {
      if (window.prompt('Type "RESET CLICKS" to confirm resetting all affiliate clicks:') === 'RESET CLICKS') {
        await supabase.from('affiliate_clicks').delete().neq('id', 'dummy')
        alert('Affiliate clicks reset.')
      }
    }
  }

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }
  const kpiLabel = { fontSize: 13, color: '#F5A623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '1.5rem', fontWeight: 600 }
  const inputGroup = { marginBottom: '1.25rem' }
  const inputStyle = { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: 8, color: '#fff', fontSize: 14, width: '100%', maxWidth: 400, marginTop: 6 }
  const btnStyle = { background: '#F5A623', border: 'none', padding: '10px 20px', borderRadius: 8, color: '#000', fontSize: 14, cursor: 'pointer', fontWeight: 700 }

  if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading settings...</div>

  return (
    <div style={{ maxWidth: 800 }}>
      
      <form onSubmit={handleSave}>
        
        {/* Platform Settings */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Platform Settings</div>
          
          <div style={inputGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: 'fit-content' }}>
              <input 
                type="checkbox" 
                checked={settings.maintenance_mode === 'true'} 
                onChange={e => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14 }}>Enable Maintenance Mode</span>
            </label>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 30, marginTop: 4 }}>Shows a maintenance page for non-admin users.</div>
          </div>

          <div style={inputGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: 'fit-content' }}>
              <input 
                type="checkbox" 
                checked={settings.allow_signups === 'true'} 
                onChange={e => handleChange('allow_signups', e.target.checked ? 'true' : 'false')}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14 }}>Allow New Signups</span>
            </label>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 30, marginTop: 4 }}>Disabling this will block new user registrations.</div>
          </div>

          <div style={inputGroup}>
            <label style={{ fontSize: 14 }}>Default Global Currency</label>
            <select value={settings.default_currency} onChange={e => handleChange('default_currency', e.target.value)} style={inputStyle}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EGP">EGP (E£)</option>
              <option value="ZAR">ZAR (R)</option>
              <option value="NGN">NGN (₦)</option>
            </select>
          </div>
        </div>

        {/* Calculator Settings */}
        <div style={cardStyle}>
          <div style={kpiLabel}>Calculator Engine Parameters</div>
          
          <div style={inputGroup}>
            <label style={{ fontSize: 14 }}>Default Electricity Price (per kWh)</label>
            <input type="number" step="0.01" value={settings.default_electricity_price} onChange={e => handleChange('default_electricity_price', e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Used when regional exact pricing is unknown.</div>
          </div>

          <div style={inputGroup}>
            <label style={{ fontSize: 14 }}>Default CO₂ Factor (kg per kWh)</label>
            <input type="number" step="0.01" value={settings.default_co2_factor} onChange={e => handleChange('default_co2_factor', e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Emissions intensity of the grid.</div>
          </div>

          <div style={inputGroup}>
            <label style={{ fontSize: 14 }}>Annual Panel Degradation Factor</label>
            <input type="number" step="0.001" value={settings.panel_degradation_factor} onChange={e => handleChange('panel_degradation_factor', e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Example: 0.005 = 0.5% degradation per year.</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <button type="submit" style={btnStyle} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
      </form>

      {/* Danger Zone */}
      <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <div style={{ ...kpiLabel, color: '#EF4444' }}>Danger Zone</div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(239,68,68,0.1)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Clear Waitlist</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Permanently delete all waitlist signups.</div>
          </div>
          <button onClick={() => handleDangerAction('clear_waitlist')} style={{ ...btnStyle, background: 'transparent', border: '1px solid #EF4444', color: '#EF4444' }}>Clear Waitlist</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Reset Affiliate Clicks</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Permanently delete all click tracking history.</div>
          </div>
          <button onClick={() => handleDangerAction('reset_clicks')} style={{ ...btnStyle, background: 'transparent', border: '1px solid #EF4444', color: '#EF4444' }}>Reset Clicks</button>
        </div>
      </div>

    </div>
  )
}
