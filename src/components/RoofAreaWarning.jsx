export default function RoofAreaWarning({ specs }) {
  if (!specs?.roofLimited) return null

  return (
    <div role="alert" style={{
      marginTop: 12,
      padding: '10px 12px',
      borderRadius: 8,
      color: '#F5A623',
      background: 'rgba(245,166,35,0.08)',
      border: '1px solid rgba(245,166,35,0.25)',
      fontSize: 13,
    }}>
      Roof area limits the design. This array is estimated to cover {specs.roofLoadCoveragePercent}% of the modeled annual load.
    </div>
  )
}
