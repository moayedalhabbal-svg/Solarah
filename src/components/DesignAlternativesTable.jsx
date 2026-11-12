export default function DesignAlternativesTable({ alternatives }) {
  if (!alternatives) return null

  const rows = [
    alternatives.fullOffset,
    alternatives.balanced,
    alternatives.hybridNoBattery,
  ].filter(Boolean)

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <h3 style={{ fontSize: 15, margin: '0 0 10px' }}>Design alternatives</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620, fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
            <th style={{ padding: 8 }}>Option</th>
            <th style={{ padding: 8 }}>PV</th>
            <th style={{ padding: 8 }}>Panels</th>
            <th style={{ padding: 8 }}>Cost (USD)</th>
            <th style={{ padding: 8 }}>Savings/year (USD)</th>
            <th style={{ padding: 8 }}>Payback</th>
            <th style={{ padding: 8 }}>NPV (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(option => (
            <tr key={option.label} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <td style={{ padding: 8, fontWeight: option.recommended ? 700 : 400 }}>
                {option.label}{option.recommended ? ' · Recommended' : ''}
              </td>
              <td style={{ padding: 8 }}>{option.kWp.toLocaleString()} kWp</td>
              <td style={{ padding: 8 }}>{option.panels.toLocaleString()}</td>
              <td style={{ padding: 8 }}>USD {option.cost.toLocaleString()}</td>
              <td style={{ padding: 8 }}>USD {option.annualSavings.toLocaleString()}</td>
              <td style={{ padding: 8 }}>{option.payback == null ? 'Not recovered' : `${option.payback} years`}</td>
              <td style={{ padding: 8 }}>USD {option.npv.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        At a flat tariff, batteries are priced for backup, not savings. NPV uses an unverified 8% discount rate.
      </p>
    </div>
  )
}
