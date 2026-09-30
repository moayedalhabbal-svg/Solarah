import { useState, useRef } from 'react'

const ANIM_CSS = `
@keyframes sld-flow-right { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
@keyframes sld-flow-left { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 24; } }
@keyframes sld-flow-down { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
@keyframes sld-flow-up { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 24; } }
.flow-right { animation: sld-flow-right 1s linear infinite; }
.flow-left { animation: sld-flow-left 1s linear infinite; }
.flow-down { animation: sld-flow-down 1s linear infinite; }
.flow-up { animation: sld-flow-up 1s linear infinite; }
.flow-paused { animation-play-state: paused; opacity: 0.2; }
.sld-controls button {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.sld-controls button:hover { background: rgba(255,255,255,0.15); }
.sld-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.3);
  color: white;
  width: 30px;
  text-align: center;
  font-size: 10px;
}
.sld-input:focus { outline: none; border-bottom: 1px solid #F5A623; }
`;

function PVModule({ x, y, w = 30, h = 45 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#F5A623" strokeWidth={1.5} />
      <line x1={x} y1={y + h} x2={x + w} y2={y} stroke="#F5A623" strokeWidth={1} />
      <text x={x + 10} y={y + 12} fontSize={10} fill="#F5A623">+</text>
      <text x={x + w - 10} y={y + h - 5} fontSize={10} fill="#F5A623">−</text>
    </g>
  )
}

function Fuse({ x, y }) {
  return (
    <g>
      <rect x={x - 12} y={y - 6} width={24} height={12} fill="none" stroke="#fff" strokeWidth={1.5} />
      <line x1={x - 12} y1={y} x2={x + 12} y2={y} stroke="#fff" strokeWidth={1.5} />
    </g>
  )
}

function Isolator({ x, y, isAC = false }) {
  const c = isAC ? '#7C3AED' : '#EF4444';
  return (
    <g>
      <circle cx={x - 12} cy={y} r={3} fill="none" stroke={c} strokeWidth={1.5} />
      <line x1={x - 9} y1={y} x2={x + 9} y2={y - 12} stroke={c} strokeWidth={2} />
      <circle cx={x + 12} cy={y} r={3} fill="none" stroke={c} strokeWidth={1.5} />
      <line x1={x} y1={y - 6} x2={x} y2={y - 18} stroke={c} strokeWidth={1.5} strokeDasharray="2,2"/>
      <rect x={x - 4} y={y - 22} width={8} height={4} fill={c} />
    </g>
  )
}

function EnergyMeter({ x, y }) {
  return (
    <g>
      <rect x={x - 20} y={y - 20} width={40} height={40} fill="none" stroke="#7C3AED" strokeWidth={1.5} />
      <text x={x} y={y - 2} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#7C3AED">kWh</text>
      <line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8} stroke="#7C3AED" strokeWidth={1} />
      <polygon points={`${x - 10},${y + 8} ${x - 5},${y + 5} ${x - 5},${y + 11}`} fill="#7C3AED" />
      <polygon points={`${x + 10},${y + 8} ${x + 5},${y + 5} ${x + 5},${y + 11}`} fill="#7C3AED" />
    </g>
  )
}

function GridSymbol({ x, y }) {
  return (
    <g>
      <circle cx={x} cy={y} r={20} fill="none" stroke="#7C3AED" strokeWidth={2} />
      <path d={`M${x - 12},${y} Q${x - 6},${y - 10} ${x},${y} T${x + 12},${y}`} fill="none" stroke="#7C3AED" strokeWidth={1.5} />
    </g>
  )
}

function EarthSymbol({ x, y }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 15} stroke="#16A34A" strokeWidth={2} />
      <line x1={x - 12} y1={y + 15} x2={x + 12} y2={y + 15} stroke="#16A34A" strokeWidth={2} />
      <line x1={x - 8} y1={y + 20} x2={x + 8} y2={y + 20} stroke="#16A34A" strokeWidth={2} />
      <line x1={x - 4} y1={y + 25} x2={x + 4} y2={y + 25} stroke="#16A34A" strokeWidth={2} />
    </g>
  )
}

function Wire({ path, type, label, len, setLen, animDir, night }) {
  let color = '#EF4444';
  if (type === 'dc-') color = '#1F2937';
  if (type === 'ac') color = '#7C3AED';
  if (type === 'earth') color = '#16A34A';
  
  const isEarth = type === 'earth';
  
  let animClass = '';
  if (!isEarth) {
    if (animDir === 'right') animClass = 'flow-right';
    if (animDir === 'left') animClass = 'flow-left';
    if (animDir === 'down') animClass = 'flow-down';
    if (animDir === 'up') animClass = 'flow-up';
    if (night && type.startsWith('dc')) {
      if (animDir === 'up') animClass = 'flow-down';
      else if (animDir === 'down') animClass = 'flow-up';
      else animClass = 'flow-paused'; // PV doesn't produce at night
    }
  }

  // Find center for label roughly
  const pts = path.replace(/[M L]/g, ' ').trim().split(/\s+/);
  const midX = (parseFloat(pts[0]) + parseFloat(pts[pts.length-2])) / 2;
  const midY = (parseFloat(pts[1]) + parseFloat(pts[pts.length-1])) / 2;

  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={isEarth ? 2 : 3} strokeDasharray={isEarth ? "8,4" : "none"} />
      {!isEarth && (
        <path d={path} fill="none" stroke="#F5A623" strokeWidth={3} strokeDasharray="6,18" className={animClass} />
      )}
      {label && (
        <foreignObject x={midX - 40} y={midY - 15} width={80} height={30} style={{ overflow: 'visible' }}>
          <div style={{ background: 'rgba(11,31,58,0.8)', padding: '2px 4px', borderRadius: 4, textAlign: 'center', fontSize: 10, color: 'white', whiteSpace: 'nowrap' }}>
            <span style={{ color }}>{label}</span><br/>
            <input type="text" className="sld-input" value={len} onChange={e => setLen(e.target.value)} /> m
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export default function SystemDiagram({ specs, state, sector, systemType, products }) {
  const [night, setNight] = useState(false);
  const [lens, setLens] = useState({ pv: 15, inv: 5, bat: 3, mdb: 10 });
  const [fullScreen, setFullScreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);

  const panels = specs?.panels || 12;
  const kw = specs?.systemKW || 5;
  const invKW = specs?.inverterKW || 5;
  const batKWh = specs?.batteryKWh || 0;
  const hasBattery = batKWh > 0;
  const hasGrid = !systemType?.toLowerCase().includes('off-grid');
  
  const strings = Math.max(1, Math.ceil(panels / 15));
  const Voc = Math.round(Math.ceil(panels / strings) * 49.5);
  const Isc = 11.5;
  const Vac = 230;
  const Iac = Math.round((invKW * 1000) / Vac);

  const W = 1400;
  const H = 800;

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = (new XMLSerializer()).serializeToString(svgElement);
    const DOMURL = window.URL || window.webkitURL || window;
    const img = new Image();
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = function () {
      canvas.width = W; canvas.height = H;
      ctx.fillStyle = '#0B1F3A';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
      doc.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, W, H);
      doc.save('Solarah_SLD.pdf');
    };
    img.src = url;
  };

  const downloadSVG = () => {
    const data = (new XMLSerializer()).serializeToString(svgRef.current);
    const blob = new Blob([data], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Solarah_SLD.svg'; a.click();
  };

  const wrapperStyle = fullScreen ? {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
    background: '#0B1F3A', display: 'flex', flexDirection: 'column'
  } : {
    background: '#0B1F3A', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px'
  };

  return (
    <div style={wrapperStyle}>
      <style>{ANIM_CSS}</style>
      <div className="sld-controls" style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(0,0,0,0.3)', alignItems: 'center' }}>
        <div style={{ color: 'white', fontWeight: 'bold', marginRight: 'auto' }}>Engineering SLD</div>
        <button onClick={() => setNight(!night)}>{night ? '🌞 Switch to Day' : '🌙 Switch to Night'}</button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>Zoom Out</button>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.2))}>Zoom In</button>
        <button onClick={downloadSVG}>SVG</button>
        <button onClick={downloadPDF}>PDF</button>
        <button onClick={() => setFullScreen(!fullScreen)}>{fullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: W, height: H }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ background: '#0B1F3A' }}>
            
            {/* Zones */}
            <rect x={50} y={50} width={600} height={700} fill="rgba(239,68,68,0.02)" />
            <text x={350} y={80} textAnchor="middle" fill="rgba(239,68,68,0.4)" fontSize={24} fontWeight="bold" letterSpacing={4}>DC SIDE</text>
            <rect x={650} y={50} width={700} height={700} fill="rgba(124,58,237,0.02)" />
            <text x={1000} y={80} textAnchor="middle" fill="rgba(124,58,237,0.4)" fontSize={24} fontWeight="bold" letterSpacing={4}>AC SIDE</text>
            <line x1={650} y1={50} x2={650} y2={750} stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeDasharray="10,10" />

            {/* Main Bus Y = 300 */}
            
            {/* PV Array */}
            <g transform="translate(100, 200)">
              <rect x={-20} y={-40} width={140} height={200} fill="none" stroke="rgba(245,166,35,0.3)" strokeWidth={2} strokeDasharray="5,5" />
              <text x={50} y={-20} textAnchor="middle" fill="#F5A623" fontSize={14} fontWeight="bold">PV Array</text>
              <PVModule x={0} y={0} />
              <PVModule x={40} y={0} />
              <text x={95} y={25} fill="#F5A623" fontSize={14}>...</text>
              <PVModule x={0} y={60} />
              <PVModule x={40} y={60} />
              <text x={95} y={85} fill="#F5A623" fontSize={14}>...</text>
              <text x={50} y={140} textAnchor="middle" fill="white" fontSize={12}>{panels} Panels, {strings} Strings</text>
              <text x={50} y={155} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: PV1-{panels}</text>
            </g>

            <Wire path="M 220 220 L 320 220" type="dc+" label="DC+ (6mm² Cu)" len={lens.pv} setLen={l => setLens({...lens, pv: l})} animDir="right" night={night} />
            <Wire path="M 220 280 L 320 280" type="dc-" label="DC− (6mm² Cu)" len={lens.pv} setLen={() => {}} animDir="right" night={night} />

            {/* Combiner Box */}
            <g transform="translate(320, 180)">
              <rect x={0} y={0} width={80} height={140} fill="none" stroke="#EF4444" strokeWidth={2} />
              <text x={40} y={20} textAnchor="middle" fill="#EF4444" fontSize={12} fontWeight="bold">Combiner</text>
              <text x={40} y={35} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: CB1</text>
              <Fuse x={40} y={60} />
              <text x={60} y={64} fill="white" fontSize={10}>15A</text>
              <Fuse x={40} y={100} />
              <text x={60} y={104} fill="white" fontSize={10}>15A</text>
              <text x={40} y={160} textAnchor="middle" fill="white" fontSize={12}>Voc: {Voc}V</text>
              <text x={40} y={175} textAnchor="middle" fill="white" fontSize={12}>Isc: {Isc}A</text>
            </g>

            <Wire path="M 400 250 L 460 250" type="dc+" animDir="right" night={night} />
            
            {/* DC Isolator */}
            <g transform="translate(460, 250)">
              <Isolator x={20} y={0} isAC={false} />
              <text x={20} y={30} textAnchor="middle" fill="#EF4444" fontSize={12}>DC Isolator</text>
              <text x={20} y={45} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: SW1</text>
            </g>

            <Wire path="M 500 250 L 560 250" type="dc+" animDir="right" night={night} />

            {/* Inverter */}
            <g transform="translate(560, 150)">
              <rect x={0} y={0} width={180} height={200} fill="none" stroke="#F5A623" strokeWidth={3} />
              <text x={90} y={30} textAnchor="middle" fill="#F5A623" fontSize={16} fontWeight="bold">INVERTER</text>
              <text x={90} y={50} textAnchor="middle" fill="white" fontSize={14}>{products?.inverter?.name || 'Hybrid Inverter'}</text>
              <text x={90} y={70} textAnchor="middle" fill="white" fontSize={14}>{invKW} kW · 98% Eff</text>
              <text x={90} y={90} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: INV1</text>
              <line x1={90} y1={100} x2={90} y2={180} stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="4,4" />
              <text x={45} y={145} textAnchor="middle" fill="white" fontSize={16}>DC</text>
              <text x={135} y={145} textAnchor="middle" fill="white" fontSize={16}>AC</text>
              {/* Earth connection */}
              <Wire path="M 90 200 L 90 240" type="earth" />
              <EarthSymbol x={90} y={240} />
            </g>

            <Wire path="M 740 250 L 820 250" type="ac" label="AC (10mm² Cu)" len={lens.inv} setLen={l => setLens({...lens, inv: l})} animDir="right" />
            <text x={780} y={220} textAnchor="middle" fill="white" fontSize={12}>Vac: {Vac}V, Iac: {Iac}A</text>

            {/* AC Isolator */}
            <g transform="translate(820, 250)">
              <Isolator x={20} y={0} isAC={true} />
              <text x={20} y={30} textAnchor="middle" fill="#7C3AED" fontSize={12}>AC Isolator</text>
              <text x={20} y={45} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: SW2</text>
            </g>

            <Wire path="M 860 250 L 920 250" type="ac" animDir="right" />

            {/* Meter */}
            {hasGrid && (
              <g transform="translate(940, 250)">
                <EnergyMeter x={0} y={0} />
                <text x={0} y={40} textAnchor="middle" fill="#7C3AED" fontSize={12}>Grid Meter</text>
                <text x={0} y={55} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: M1</text>
              </g>
            )}

            <Wire path="M 960 250 L 1020 250" type="ac" animDir="right" />

            {/* MDB */}
            <g transform="translate(1020, 150)">
              <rect x={0} y={0} width={100} height={200} fill="none" stroke="#7C3AED" strokeWidth={3} />
              <text x={50} y={30} textAnchor="middle" fill="#7C3AED" fontSize={16} fontWeight="bold">MDB</text>
              <text x={50} y={45} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: MDB1</text>
              <rect x={20} y={80} width={60} height={15} fill="none" stroke="white" strokeWidth={1} />
              <rect x={20} y={110} width={60} height={15} fill="none" stroke="white" strokeWidth={1} />
              <rect x={20} y={140} width={60} height={15} fill="none" stroke="white" strokeWidth={1} />
              <text x={50} y={190} textAnchor="middle" fill="white" fontSize={10}>Main: {Math.max(40, Iac + 10)}A</text>
              <Wire path="M 50 200 L 50 240" type="earth" />
              <EarthSymbol x={50} y={240} />
            </g>

            <Wire path="M 1120 250 L 1220 250" type="ac" label="AC (10mm² Cu)" len={lens.mdb} setLen={l => setLens({...lens, mdb: l})} animDir="right" />

            {/* Load */}
            <g transform="translate(1220, 210)">
              {sector === 'industrial' ? (
                <path d="M 0 40 L 0 0 L 20 0 L 20 20 L 40 0 L 40 40 Z" fill="none" stroke="white" strokeWidth={2} />
              ) : sector === 'commercial' ? (
                <rect x={0} y={0} width={40} height={60} fill="none" stroke="white" strokeWidth={2} />
              ) : (
                <path d="M 0 30 L 20 0 L 40 30 L 40 60 L 0 60 Z" fill="none" stroke="white" strokeWidth={2} />
              )}
              <text x={20} y={80} textAnchor="middle" fill="white" fontSize={14}>{sector === 'commercial' ? 'Commercial' : sector === 'industrial' ? 'Industrial' : 'Residential'} Load</text>
            </g>

            {/* Grid Connection */}
            {hasGrid && (
              <>
                <Wire path="M 1070 150 L 1070 80 L 1220 80" type="ac" animDir="left" />
                <g transform="translate(1260, 80)">
                  <GridSymbol x={0} y={0} />
                  <text x={0} y={40} textAnchor="middle" fill="#7C3AED" fontSize={14}>Utility Grid</text>
                </g>
              </>
            )}

            {/* Battery Branch */}
            {hasBattery && (
              <g>
                <Wire path="M 605 350 L 605 450 L 500 450" type="dc+" label="DC+ (16mm² Cu)" len={lens.bat} setLen={l => setLens({...lens, bat: l})} animDir={night ? 'up' : 'down'} night={night} />
                <Wire path="M 695 350 L 695 480 L 500 480" type="dc-" animDir={night ? 'up' : 'down'} night={night} />
                
                {/* BMS */}
                <g transform="translate(420, 440)">
                  <rect x={0} y={0} width={80} height={50} fill="none" stroke="#F5A623" strokeWidth={2} />
                  <text x={40} y={20} textAnchor="middle" fill="#F5A623" fontSize={14} fontWeight="bold">BMS</text>
                  <text x={40} y={40} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: BMS1</text>
                </g>

                <Wire path="M 420 465 L 360 465" type="dc+" animDir={night ? 'right' : 'left'} night={night} />

                {/* Battery */}
                <g transform="translate(240, 410)">
                  <rect x={0} y={0} width={120} height={110} fill="none" stroke="#F5A623" strokeWidth={2} />
                  <text x={60} y={20} textAnchor="middle" fill="#F5A623" fontSize={14} fontWeight="bold">BATTERY</text>
                  <text x={60} y={35} textAnchor="middle" fill="white" fontSize={12}>{batKWh} kWh LFP</text>
                  <text x={60} y={50} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>Ref: B1</text>
                  {/* IEC Battery Symbol */}
                  <g transform="translate(60, 70)">
                    <line x1={-20} y1={0} x2={20} y2={0} stroke="#F5A623" strokeWidth={3} />
                    <line x1={-10} y1={8} x2={10} y2={8} stroke="#F5A623" strokeWidth={3} />
                    <line x1={-20} y1={16} x2={20} y2={16} stroke="#F5A623" strokeWidth={3} />
                    <line x1={-10} y1={24} x2={10} y2={24} stroke="#F5A623" strokeWidth={3} />
                  </g>
                  <Wire path="M 60 110 L 60 140" type="earth" />
                  <EarthSymbol x={60} y={140} />
                </g>
                
                {/* BMS control line */}
                <path d="M 420 440 L 360 440 L 360 410 L 330 410" fill="none" stroke="#3B82F6" strokeWidth={1} strokeDasharray="4,2" />
                <text x={380} y={435} fill="#3B82F6" fontSize={8}>Comms</text>
              </g>
            )}

            {/* Title Block */}
            <g transform="translate(1000, 650)">
              <rect x={0} y={0} width={350} height={100} fill="rgba(255,255,255,0.02)" stroke="white" strokeWidth={2} />
              <line x1={0} y1={25} x2={350} y2={25} stroke="white" strokeWidth={1} />
              <line x1={0} y1={50} x2={350} y2={50} stroke="white" strokeWidth={1} />
              <line x1={0} y1={75} x2={350} y2={75} stroke="white" strokeWidth={1} />
              <line x1={200} y1={50} x2={200} y2={100} stroke="white" strokeWidth={1} />
              <text x={175} y={18} textAnchor="middle" fill="#F5A623" fontSize={16} fontWeight="bold">SOLARAH SYSTEM DESIGN</text>
              <text x={10} y={42} fill="white" fontSize={12}>Title: Single-Line Diagram (SLD)</text>
              <text x={10} y={67} fill="white" fontSize={12}>System Size: {kw} kWp</text>
              <text x={210} y={67} fill="white" fontSize={12}>Date: {new Date().toISOString().split('T')[0]}</text>
              <text x={10} y={92} fill="white" fontSize={12}>Standard: IEC 61082 / IEC 60617</text>
              <text x={210} y={92} fill="white" fontSize={12}>Status: PRELIMINARY</text>
            </g>

            {/* Legend Box */}
            <g transform="translate(100, 600)">
              <rect x={0} y={0} width={250} height={150} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
              <text x={10} y={20} fill="white" fontSize={14} fontWeight="bold">LEGEND</text>
              
              <line x1={10} y1={40} x2={40} y2={40} stroke="#EF4444" strokeWidth={3} />
              <text x={50} y={45} fill="white" fontSize={12}>DC Positive</text>
              
              <line x1={10} y1={60} x2={40} y2={60} stroke="#1F2937" strokeWidth={3} />
              <text x={50} y={65} fill="white" fontSize={12}>DC Negative</text>

              <line x1={10} y1={80} x2={40} y2={80} stroke="#7C3AED" strokeWidth={3} />
              <text x={50} y={85} fill="white" fontSize={12}>AC Power</text>

              <line x1={10} y1={100} x2={40} y2={100} stroke="#16A34A" strokeWidth={2} strokeDasharray="8,4" />
              <text x={50} y={105} fill="white" fontSize={12}>Protective Earth</text>

              <line x1={10} y1={120} x2={40} y2={120} stroke="#3B82F6" strokeWidth={1} strokeDasharray="4,2" />
              <text x={50} y={125} fill="white" fontSize={12}>Control / Comms</text>
            </g>

          </svg>
        </div>
      </div>
    </div>
  )
}
