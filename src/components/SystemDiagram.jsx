// ── Solarah Engineering Single-Line Diagram (SLD) ─────────────────────────────
// IEC-standard symbols, animated energy flow, sector-aware, fully responsive.

const ANIM_CSS = `
@keyframes sld-flow-right {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}
@keyframes sld-flow-left {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 24; }
}
@keyframes sld-flow-down {
  from { stroke-dashoffset: 24; }
  to   { stroke-dashoffset: 0; }
}
@keyframes sld-flow-up {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 24; }
}
@keyframes sld-pulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}
`

// ── IEC Symbol Components ─────────────────────────────────────────────────────

// PV Module (rectangle + diagonal line)
function PVModule({ x, y, w = 28, h = 40, c = '#F5A623' }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={c} strokeWidth={1.5} />
      <line x1={x} y1={y + h} x2={x + w} y2={y} stroke={c} strokeWidth={1} />
      <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize={6} fill={c}>+</text>
      <text x={x + w / 2} y={y + h + 9} textAnchor="middle" fontSize={6} fill={c}>−</text>
    </g>
  )
}

// Fuse symbol (two small arcs)
function Fuse({ x, y, vertical = false, c = '#fff' }) {
  if (vertical) {
    return (
      <g>
        <rect x={x - 3} y={y - 8} width={6} height={16} rx={2} fill="none" stroke={c} strokeWidth={1.2} />
        <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke={c} strokeWidth={1} />
      </g>
    )
  }
  return (
    <g>
      <rect x={x - 8} y={y - 3} width={16} height={6} rx={2} fill="none" stroke={c} strokeWidth={1.2} />
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke={c} strokeWidth={1} />
    </g>
  )
}

// DC Isolator / Switch symbol (IEC: line with gap and arc)
function Isolator({ x, y, label, c = '#fff', labelColor = 'rgba(255,255,255,0.5)' }) {
  return (
    <g>
      <circle cx={x - 8} cy={y} r={2.5} fill="none" stroke={c} strokeWidth={1.2} />
      <line x1={x - 5.5} y1={y} x2={x + 6} y2={y - 10} stroke={c} strokeWidth={1.5} />
      <circle cx={x + 8} cy={y} r={2.5} fill="none" stroke={c} strokeWidth={1.2} />
      {label && <text x={x} y={y + 14} textAnchor="middle" fontSize={7} fill={labelColor}>{label}</text>}
    </g>
  )
}

// Circuit Breaker symbol (IEC: rectangle with X)
function CircuitBreaker({ x, y, label, c = '#fff', labelColor = 'rgba(255,255,255,0.5)' }) {
  return (
    <g>
      <rect x={x - 6} y={y - 8} width={12} height={16} fill="none" stroke={c} strokeWidth={1.2} />
      <line x1={x - 4} y1={y - 6} x2={x + 4} y2={y + 6} stroke={c} strokeWidth={1} />
      <line x1={x + 4} y1={y - 6} x2={x - 4} y2={y + 6} stroke={c} strokeWidth={1} />
      {label && <text x={x} y={y + 18} textAnchor="middle" fontSize={7} fill={labelColor}>{label}</text>}
    </g>
  )
}

// Bidirectional Energy Meter
function EnergyMeter({ x, y, c = '#fff', labelColor = 'rgba(255,255,255,0.5)' }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="none" stroke={c} strokeWidth={1.2} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight="700" fill={c}>kWh</text>
      <line x1={x - 5} y1={y - 7} x2={x + 5} y2={y - 7} stroke={c} strokeWidth={0.8} />
      <polygon points={`${x - 3},${y - 10} ${x},${y - 7} ${x - 6},${y - 7}`} fill={c} />
      <polygon points={`${x + 3},${y - 4} ${x},${y - 7} ${x + 6},${y - 7}`} fill={c} />
      <text x={x} y={y + 22} textAnchor="middle" fontSize={7} fill={labelColor}>Bi-directional</text>
      <text x={x} y={y + 30} textAnchor="middle" fontSize={7} fill={labelColor}>meter</text>
    </g>
  )
}

// Battery Cell Stack symbol (IEC)
function BatterySymbol({ x, y, kWh, c = '#F5A623', labelColor = 'rgba(255,255,255,0.5)' }) {
  const plates = 4
  return (
    <g>
      {Array.from({ length: plates }).map((_, i) => {
        const cy = y + i * 8
        const isLong = i % 2 === 0
        return (
          <line key={i}
            x1={x - (isLong ? 10 : 5)} y1={cy}
            x2={x + (isLong ? 10 : 5)} y2={cy}
            stroke={c} strokeWidth={isLong ? 2 : 1.2}
          />
        )
      })}
      <text x={x + 16} y={y + 2} fontSize={6} fill={c}>+</text>
      <text x={x + 16} y={y + (plates - 1) * 8 + 2} fontSize={6} fill={c}>−</text>
      <text x={x} y={y + plates * 8 + 10} textAnchor="middle" fontSize={8} fontWeight="600" fill={c}>{kWh} kWh</text>
      <text x={x} y={y + plates * 8 + 19} textAnchor="middle" fontSize={7} fill={labelColor}>LFP</text>
    </g>
  )
}

// Transformer symbol (two coupled coils)
function Transformer({ x, y, c = '#fff', labelColor = 'rgba(255,255,255,0.5)' }) {
  return (
    <g>
      <circle cx={x - 6} cy={y} r={9} fill="none" stroke={c} strokeWidth={1.2} />
      <circle cx={x + 6} cy={y} r={9} fill="none" stroke={c} strokeWidth={1.2} />
      <text x={x} y={y + 20} textAnchor="middle" fontSize={7} fill={labelColor}>Transformer</text>
    </g>
  )
}

// Grid symbol (sine wave in circle)
function GridSymbol({ x, y, c = '#6366F1' }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} fill="none" stroke={c} strokeWidth={1.5} />
      <path d={`M${x - 8},${y} Q${x - 4},${y - 7} ${x},${y} Q${x + 4},${y + 7} ${x + 8},${y}`}
        fill="none" stroke={c} strokeWidth={1.2} />
      <text x={x} y={y + 26} textAnchor="middle" fontSize={8} fontWeight="600" fill={c}>Grid</text>
    </g>
  )
}

// Load icons
function ResidentialLoad({ x, y }) {
  return (
    <g>
      <polygon points={`${x},${y - 16} ${x - 14},${y - 2} ${x + 14},${y - 2}`} fill="none" stroke="#27AE60" strokeWidth={1.5} />
      <rect x={x - 10} y={y - 2} width={20} height={16} fill="none" stroke="#27AE60" strokeWidth={1.5} />
      <rect x={x - 3} y={y + 4} width={6} height={10} fill="none" stroke="#27AE60" strokeWidth={1} />
    </g>
  )
}
function CommercialLoad({ x, y }) {
  return (
    <g>
      <rect x={x - 12} y={y - 18} width={24} height={34} fill="none" stroke="#27AE60" strokeWidth={1.5} />
      {[0, 1, 2, 3].map(r => [0, 1].map(col => (
        <rect key={`${r}${col}`} x={x - 8 + col * 12} y={y - 14 + r * 8} width={5} height={4} fill="none" stroke="#27AE60" strokeWidth={0.8} />
      )))}
    </g>
  )
}
function IndustrialLoad({ x, y }) {
  return (
    <g>
      <rect x={x - 16} y={y - 8} width={32} height={24} fill="none" stroke="#27AE60" strokeWidth={1.5} />
      <polygon points={`${x - 10},${y - 8} ${x - 6},${y - 20} ${x - 2},${y - 8}`} fill="none" stroke="#27AE60" strokeWidth={1.2} />
      <polygon points={`${x + 2},${y - 8} ${x + 6},${y - 20} ${x + 10},${y - 8}`} fill="none" stroke="#27AE60" strokeWidth={1.2} />
      <line x1={x - 6} y1={y - 20} x2={x - 6} y2={y - 26} stroke="#27AE60" strokeWidth={1} />
      <line x1={x + 6} y1={y - 20} x2={x + 6} y2={y - 26} stroke="#27AE60" strokeWidth={1} />
    </g>
  )
}

// ── Animated wire ─────────────────────────────────────────────────────────────

function AnimWire({ d, color = '#E74C3C', direction = 'right', wireLabel, labelX, labelY, labelColor = 'rgba(255,255,255,0.35)' }) {
  const anim = direction === 'left' ? 'sld-flow-left' : direction === 'up' ? 'sld-flow-up' : direction === 'down' ? 'sld-flow-down' : 'sld-flow-right'
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.8}
        strokeDasharray="6,18" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: `${anim} 1.2s linear infinite` }} />
      {wireLabel && <text x={labelX} y={labelY} fontSize={6.5} fill={labelColor}>{wireLabel}</text>}
    </g>
  )
}

// ── Box with label ────────────────────────────────────────────────────────────
function SLDBox({ x, y, w, h, lines, accent = '#fff', bg = 'rgba(255,255,255,0.04)', borderC = 'rgba(255,255,255,0.15)' }) {
  const textColor = 'rgba(255,255,255,0.85)'
  const dimColor = 'rgba(255,255,255,0.45)'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={bg} stroke={borderC} strokeWidth={0.8} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={accent} strokeWidth={3} />
      {lines.map((line, i) => (
        <text key={i} x={x + w / 2} y={y + 13 + i * 12} textAnchor="middle"
          fontSize={line.size || 8} fontWeight={line.bold ? '700' : '400'}
          fill={line.color || (i === 0 ? textColor : dimColor)}>
          {line.text}
        </text>
      ))}
    </g>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SystemDiagram({ specs, state, sector: sectorProp, systemType: stProp, products }) {
  const sector = sectorProp || state?.sector || specs?.sector || 'residential'
  const systemType = (stProp || state?.systemType || '').toLowerCase()
  const hasBattery = systemType.includes('grid-tied only') ? false : (specs?.batteryKWh || 0) > 0
  const isOffGrid = systemType.includes('off-grid')
  const isGridTied = systemType.includes('grid-tied only')
  const hasGrid = !isOffGrid
  const panels = specs?.panels || 6
  const kw = specs?.systemKW || 5
  const invKW = specs?.inverterKW || 6
  const batKWh = specs?.batteryKWh || 0
  const isLargeIndustrial = sector === 'industrial' && kw > 200
  const numInverters = isLargeIndustrial ? Math.ceil(kw / 100) : 1
  const strings = Math.max(1, Math.ceil(panels / 15))
  const perString = Math.ceil(panels / strings)
  const Voc = Math.round(perString * 49.5)   // ~49.5V Voc per 400W mono panel
  const Isc = 11.5                             // ~11.5A Isc for 400W panel

  // Product names
  const invName = products?.inverter?.name || (sector === 'industrial' ? `SMA Central ${Math.ceil(kw / 100) * 100}kW` : sector === 'commercial' ? `Huawei SUN2000-${Math.ceil(kw / 10) * 10}KTL` : `Growatt SPH ${invKW}kW`)
  const wireGaugeDC = kw > 100 ? '10mm²' : kw > 20 ? '6mm²' : '4mm²'
  const wireGaugeAC = kw > 100 ? '16mm²' : kw > 20 ? '6mm²' : '4mm²'

  // Layout
  const W = isLargeIndustrial ? 1100 : 920
  const rowY = 110
  const batRowY = hasBattery ? 290 : 0
  const H = hasBattery ? 420 : (isLargeIndustrial ? 330 : 280)

  // X positions (left to right)
  const pvX = 30
  const pvEndX = pvX + 100
  const combX = pvEndX + 40
  const dcIsoX = combX + 70
  const invX_start = dcIsoX + 50
  const invW = isLargeIndustrial ? 120 : 100
  const invEndX = invX_start + invW
  const txX = isLargeIndustrial ? invEndX + 50 : 0
  const acIsoX = (isLargeIndustrial ? txX + 50 : invEndX + 40)
  const meterX = acIsoX + 60
  const mdbX = meterX + 60
  const loadX = mdbX + 70
  const gridX = hasGrid ? mdbX + 30 : 0

  return (
    <div style={{ background: '#0B1F3A', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.12)', padding: '1rem 0.75rem', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Single-line diagram (SLD)
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>IEC 61082 / IEC 60617</div>
      </div>
      <style>{ANIM_CSS}</style>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} aria-label="System single-line diagram">

        {/* ── PV String Array ────────────────────────────── */}
        <text x={pvX + 50} y={30} textAnchor="middle" fontSize={9} fontWeight="700" fill="#F5A623">PV Array</text>
        <text x={pvX + 50} y={40} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.45)">{panels} × 400W · {strings} string{strings > 1 ? 's' : ''}</text>

        {Array.from({ length: Math.min(strings, 4) }).map((_, si) => {
          const sy = 50 + si * 50
          const showLabel = si === 0
          return (
            <g key={si}>
              {/* Two PV modules per string (representative) */}
              <PVModule x={pvX} y={sy} w={22} h={34} />
              <PVModule x={pvX + 28} y={sy} w={22} h={34} />
              {/* Series dots */}
              <text x={pvX + 56} y={sy + 20} fontSize={8} fill="rgba(255,255,255,0.4)">···</text>
              <PVModule x={pvX + 70} y={sy} w={22} h={34} />
              {/* String label */}
              <text x={pvX + 100} y={sy + 14} fontSize={6.5} fill="rgba(255,255,255,0.5)">S{si + 1}: {perString}P</text>
              {showLabel && (
                <text x={pvX + 100} y={sy + 24} fontSize={6} fill="rgba(255,255,255,0.35)">Voc={Voc}V Isc={Isc}A</text>
              )}
              {/* DC wire from string to combiner */}
              <AnimWire
                d={`M${pvX + 95},${sy + 17} L${combX},${sy + 17}`}
                color="#E74C3C" direction="right"
                wireLabel={si === 0 ? wireGaugeDC : undefined}
                labelX={pvX + 105} labelY={sy + 12}
              />
            </g>
          )
        })}
        {strings > 4 && (
          <text x={pvX + 50} y={50 + 4 * 50 + 10} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)">
            +{strings - 4} more string{strings - 4 > 1 ? 's' : ''}
          </text>
        )}

        {/* ── String Combiner Box ────────────────────────── */}
        <SLDBox x={combX} y={55} w={50} h={Math.min(strings, 4) * 50 - 5} accent="#E74C3C"
          lines={[{ text: 'String', bold: true }, { text: 'Combiner' }, { text: 'Box' }]} />
        {/* Fuses inside combiner */}
        {Array.from({ length: Math.min(strings, 4) }).map((_, si) => (
          <Fuse key={si} x={combX + 25} y={67 + si * 50} c="rgba(255,255,255,0.6)" />
        ))}

        {/* Wire from combiner to DC isolator */}
        <AnimWire
          d={`M${combX + 50},${rowY} L${dcIsoX - 12},${rowY}`}
          color="#E74C3C" direction="right"
        />

        {/* ── DC Isolator ────────────────────────────────── */}
        <Isolator x={dcIsoX} y={rowY} label="DC Isolator" c="rgba(255,255,255,0.8)" />

        {/* Wire from DC iso to inverter */}
        <AnimWire
          d={`M${dcIsoX + 12},${rowY} L${invX_start},${rowY}`}
          color="#E74C3C" direction="right"
          wireLabel={`DC+ (${wireGaugeDC})`} labelX={dcIsoX + 16} labelY={rowY - 8}
        />

        {/* DC- return wire (shown below main) */}
        <AnimWire
          d={`M${pvEndX},${rowY + 20} L${invX_start},${rowY + 20}`}
          color="#1a1a2e" direction="right"
          wireLabel="DC−" labelX={dcIsoX + 16} labelY={rowY + 32}
        />

        {/* ── Inverter(s) ────────────────────────────────── */}
        {isLargeIndustrial ? (
          <>
            {/* Multiple inverters in parallel */}
            {Array.from({ length: Math.min(numInverters, 3) }).map((_, ii) => {
              const iy = rowY - 30 + ii * 40
              return (
                <g key={ii}>
                  <SLDBox x={invX_start} y={iy} w={invW} h={32}
                    accent="#8B5CF6" lines={[
                      { text: ii === 0 ? invName.split(' ').slice(0, 3).join(' ') : `INV ${ii + 1}`, bold: true, size: 7 },
                      { text: `MPPT · ${Math.round(invKW / numInverters)}kW` }
                    ]} />
                </g>
              )
            })}
            {numInverters > 3 && (
              <text x={invX_start + invW / 2} y={rowY - 30 + 3 * 40 + 10} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.35)">
                +{numInverters - 3} more inverters
              </text>
            )}
            <text x={invX_start + invW / 2} y={rowY - 40} textAnchor="middle" fontSize={8} fontWeight="600" fill="#8B5CF6">
              {numInverters}× Inverter ({invKW} kW total)
            </text>

            {/* Wire to transformer */}
            <AnimWire
              d={`M${invEndX},${rowY} L${txX - 16},${rowY}`}
              color="#8B5CF6" direction="right"
            />
            {/* Transformer */}
            <Transformer x={txX} y={rowY} />

            {/* Wire from transformer to AC isolator */}
            <AnimWire
              d={`M${txX + 16},${rowY} L${acIsoX - 12},${rowY}`}
              color="#8B5CF6" direction="right"
            />
          </>
        ) : (
          <>
            <SLDBox x={invX_start} y={rowY - 25} w={invW} h={50}
              accent="#8B5CF6" lines={[
                { text: invName.length > 20 ? invName.slice(0, 20) + '…' : invName, bold: true, size: 7.5 },
                { text: `MPPT · ${invKW} kW` },
                { text: specs?.gridPhase === 'three' ? '3-phase' : '1-phase' },
              ]} />
            <text x={invX_start + invW / 2} y={rowY - 30} textAnchor="middle" fontSize={7} fill="#8B5CF6">INVERTER</text>

            {/* DC→AC label inside */}
            <line x1={invX_start + 4} y1={rowY + 5} x2={invX_start + invW - 4} y2={rowY + 5}
              stroke="rgba(139,92,246,0.3)" strokeWidth={0.5} strokeDasharray="2,2" />
            <text x={invX_start + 12} y={rowY + 3} fontSize={5.5} fill="rgba(255,255,255,0.3)">DC</text>
            <text x={invX_start + invW - 12} y={rowY + 3} fontSize={5.5} fill="rgba(255,255,255,0.3)">AC</text>

            {/* Wire from inverter to AC isolator */}
            <AnimWire
              d={`M${invEndX},${rowY} L${acIsoX - 12},${rowY}`}
              color="#8B5CF6" direction="right"
              wireLabel={`AC (${wireGaugeAC})`} labelX={invEndX + 4} labelY={rowY - 8}
            />
          </>
        )}

        {/* ── AC Isolator ────────────────────────────────── */}
        <Isolator x={acIsoX} y={rowY} label="AC Isolator" c="rgba(255,255,255,0.8)" />

        {/* Wire to energy meter */}
        <AnimWire
          d={`M${acIsoX + 12},${rowY} L${meterX - 12},${rowY}`}
          color="#8B5CF6" direction="right"
        />

        {/* ── Bidirectional Energy Meter ──────────────────── */}
        {hasGrid && (
          <EnergyMeter x={meterX} y={rowY} />
        )}

        {/* Wire from meter to MDB */}
        <AnimWire
          d={`M${hasGrid ? meterX + 12 : acIsoX + 12},${rowY} L${mdbX - 8},${rowY}`}
          color="#8B5CF6" direction="right"
        />

        {/* ── Main Distribution Board ────────────────────── */}
        <SLDBox x={mdbX - 8} y={rowY - 20} w={46} h={40} accent="#8B5CF6"
          lines={[{ text: 'MDB', bold: true, size: 9 }, { text: 'Distribution', size: 6.5 }]} />
        {/* Circuit breaker inside MDB */}
        <CircuitBreaker x={mdbX + 15} y={rowY} label="" c="rgba(255,255,255,0.5)" />

        {/* Wire from MDB to load */}
        <AnimWire
          d={`M${mdbX + 38},${rowY} L${loadX - 18},${rowY}`}
          color="#27AE60" direction="right"
        />

        {/* ── Load ───────────────────────────────────────── */}
        {sector === 'commercial' ? <CommercialLoad x={loadX} y={rowY} />
          : sector === 'industrial' ? <IndustrialLoad x={loadX} y={rowY + 4} />
          : <ResidentialLoad x={loadX} y={rowY} />}
        <text x={loadX} y={rowY + 28} textAnchor="middle" fontSize={8} fontWeight="600" fill="#27AE60">
          {sector === 'commercial' ? 'Building' : sector === 'industrial' ? 'Factory' : 'Home'}
        </text>
        <text x={loadX} y={rowY + 37} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.35)">
          {specs?.dailyKWh || 12} kWh/day
        </text>

        {/* ── Grid Connection ────────────────────────────── */}
        {hasGrid && (
          <>
            <AnimWire
              d={`M${mdbX + 15},${rowY + 20} L${mdbX + 15},${rowY + 55} L${gridX + 30},${rowY + 55}`}
              color="#6366F1" direction="right"
            />
            <GridSymbol x={gridX + 50} y={rowY + 55} />
          </>
        )}

        {/* ── Battery Section ────────────────────────────── */}
        {hasBattery && (
          <>
            {/* DC bus from inverter down to battery */}
            <AnimWire
              d={`M${invX_start + invW / 2},${rowY + (isLargeIndustrial ? 30 : 25)} L${invX_start + invW / 2},${batRowY}`}
              color="#F5A623" direction="down"
              wireLabel="DC bus" labelX={invX_start + invW / 2 + 6} labelY={batRowY - 30}
            />

            {/* BMS Box */}
            <SLDBox x={invX_start + invW / 2 - 50} y={batRowY} w={40} h={28} accent="#F5A623"
              lines={[{ text: 'BMS', bold: true, size: 8 }]} />

            {/* Wire from BMS to Battery */}
            <AnimWire
              d={`M${invX_start + invW / 2 - 10},${batRowY + 14} L${invX_start + invW / 2 + 20},${batRowY + 14}`}
              color="#F5A623" direction="right"
            />

            {/* Battery symbol */}
            <BatterySymbol x={invX_start + invW / 2 + 40} y={batRowY} kWh={batKWh} />

            {/* Battery capacity label */}
            <text x={invX_start + invW / 2 + 40} y={batRowY - 10} textAnchor="middle"
              fontSize={8} fontWeight="600" fill="#F5A623">BATTERY</text>
          </>
        )}

        {/* ── Earth bar ──────────────────────────────────── */}
        <line x1={invX_start + invW / 2} y1={rowY + (isLargeIndustrial ? 30 : 25)} x2={invX_start + invW / 2} y2={H - 22}
          stroke="#27AE60" strokeWidth={1} strokeDasharray="4,3" />
        <g transform={`translate(${invX_start + invW / 2}, ${H - 18})`}>
          <line x1={-8} y1={0} x2={8} y2={0} stroke="#27AE60" strokeWidth={1.5} />
          <line x1={-5} y1={4} x2={5} y2={4} stroke="#27AE60" strokeWidth={1.2} />
          <line x1={-2} y1={8} x2={2} y2={8} stroke="#27AE60" strokeWidth={1} />
        </g>
        <text x={invX_start + invW / 2 + 12} y={H - 12} fontSize={7} fill="#27AE60">Earth</text>

        {/* ── DC / AC zone labels ─────────────────────────── */}
        <rect x={pvX} y={H - 44} width={invX_start - pvX - 5} height={14} rx={3}
          fill="rgba(231,76,60,0.06)" stroke="rgba(231,76,60,0.15)" strokeWidth={0.5} />
        <text x={(pvX + invX_start) / 2} y={H - 34} textAnchor="middle" fontSize={7.5} fontWeight="600" fill="rgba(231,76,60,0.6)">
          DC SIDE
        </text>

        <rect x={invEndX + 5} y={H - 44} width={loadX + 20 - invEndX - 5} height={14} rx={3}
          fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.15)" strokeWidth={0.5} />
        <text x={(invEndX + 5 + loadX + 20) / 2} y={H - 34} textAnchor="middle" fontSize={7.5} fontWeight="600" fill="rgba(139,92,246,0.6)">
          AC SIDE
        </text>

        {/* ── Legend ──────────────────────────────────────── */}
        <g transform={`translate(${W - 180}, ${H - 58})`}>
          <rect x={0} y={0} width={170} height={52} rx={4} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
          <text x={8} y={12} fontSize={7} fontWeight="700" fill="rgba(255,255,255,0.5)">LEGEND</text>
          {/* DC+ */}
          <line x1={8} y1={22} x2={28} y2={22} stroke="#E74C3C" strokeWidth={1.5} />
          <text x={32} y={25} fontSize={6.5} fill="rgba(255,255,255,0.45)">DC+ (red)</text>
          {/* DC- */}
          <line x1={85} y1={22} x2={105} y2={22} stroke="#1a1a2e" strokeWidth={1.5} />
          <text x={109} y={25} fontSize={6.5} fill="rgba(255,255,255,0.45)">DC− (blk)</text>
          {/* AC */}
          <line x1={8} y1={34} x2={28} y2={34} stroke="#8B5CF6" strokeWidth={1.5} />
          <text x={32} y={37} fontSize={6.5} fill="rgba(255,255,255,0.45)">AC (purple)</text>
          {/* Earth */}
          <line x1={85} y1={34} x2={105} y2={34} stroke="#27AE60" strokeWidth={1.5} strokeDasharray="3,2" />
          <text x={109} y={37} fontSize={6.5} fill="rgba(255,255,255,0.45)">Earth (grn)</text>
          {/* Energy flow */}
          <line x1={8} y1={46} x2={28} y2={46} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeDasharray="6,18" />
          <text x={32} y={49} fontSize={6.5} fill="rgba(255,255,255,0.45)">Energy flow</text>
        </g>

      </svg>
    </div>
  )
}
