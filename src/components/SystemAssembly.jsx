import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGE = {
  mechanical: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Stage 1 — Mechanical', num: 1 },
  dc: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Stage 2 — DC Electrical', num: 2 },
  ac: { color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)', label: 'Stage 3 — AC & Commissioning', num: 3 },
};

// ── System overview Physical SVG ────────────────────────────────────────────────
function PhysicalOverview({ specs, hasBattery, hasGrid }) {
  return (
    <svg viewBox="0 0 800 400" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      {/* Sky/Background */}
      <rect x="0" y="0" width="800" height="400" fill="#0B1F3A" />
      {/* Sun */}
      <circle cx="700" cy="80" r="30" fill="#F5A623" opacity="0.8" />
      
      {/* House Silhouette */}
      <polygon points="100,250 400,100 700,250" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <rect x="150" y="250" width="500" height="150" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      {/* Garage area */}
      <rect x="450" y="250" width="200" height="150" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <text x="550" y="380" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="12">Garage</text>

      {/* Panels on Roof */}
      <g transform="translate(150, 160) rotate(26)">
        <rect x="0" y="0" width="150" height="30" fill="rgba(59,130,246,0.2)" stroke="#3B82F6" strokeWidth="2" />
        <rect x="0" y="35" width="150" height="30" fill="rgba(59,130,246,0.2)" stroke="#3B82F6" strokeWidth="2" />
        <text x="75" y="-10" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="bold">PV Array ({specs?.panels || 12} panels)</text>
      </g>

      {/* Inverter on Garage Wall */}
      <rect x="470" y="280" width="40" height="60" fill="rgba(245,166,35,0.2)" stroke="#F5A623" strokeWidth="2" />
      <text x="490" y="270" textAnchor="middle" fill="#F5A623" fontSize="12" fontWeight="bold">Inverter</text>

      {/* Battery on Garage Floor */}
      {hasBattery && (
        <g>
          <rect x="530" y="330" width="60" height="60" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="2" />
          <text x="560" y="320" textAnchor="middle" fill="#EF4444" fontSize="12" fontWeight="bold">Battery</text>
        </g>
      )}

      {/* MDB inside house */}
      <rect x="200" y="280" width="30" height="50" fill="rgba(124,58,237,0.2)" stroke="#7C3AED" strokeWidth="2" />
      <text x="215" y="270" textAnchor="middle" fill="#7C3AED" fontSize="12" fontWeight="bold">MDB</text>

      {/* Utility Meter outside */}
      {hasGrid && (
        <g>
          <rect x="130" y="300" width="20" height="30" fill="rgba(16,163,74,0.2)" stroke="#16A34A" strokeWidth="2" />
          <text x="110" y="290" textAnchor="middle" fill="#16A34A" fontSize="12" fontWeight="bold">Meter</text>
        </g>
      )}

      {/* Grid Connection */}
      {hasGrid && (
        <g>
          <path d="M 50 350 L 130 350" fill="none" stroke="#16A34A" strokeWidth="3" strokeDasharray="8,4" />
          <text x="50" y="340" fill="#16A34A" fontSize="12" fontWeight="bold">Utility Grid</text>
        </g>
      )}

      {/* Cable Routes (Animated dashed lines) */}
      {/* Roof to Inverter (DC) */}
      <path d="M 330 200 L 400 200 L 400 290 L 470 290" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="6,4">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
      </path>
      {/* Inverter to Battery (DC) */}
      {hasBattery && (
        <path d="M 510 320 L 530 320 L 530 350 L 530 350" fill="none" stroke="#F5A623" strokeWidth="2" strokeDasharray="6,4">
           <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
        </path>
      )}
      {/* Inverter to MDB (AC) */}
      <path d="M 470 330 L 400 330 L 400 310 L 230 310" fill="none" stroke="#7C3AED" strokeWidth="2" strokeDasharray="6,4">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
      </path>
      {/* MDB to Meter (AC) */}
      {hasGrid && (
        <path d="M 200 315 L 150 315" fill="none" stroke="#16A34A" strokeWidth="2" strokeDasharray="6,4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
        </path>
      )}
    </svg>
  );
}

// ── Technical SVGs ────────────────────────────────────────────────────────────

function SVGMC4() {
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      <text x="200" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">MC4 Connector Cross-Section</text>
      {/* Male */}
      <rect x="50" y="80" width="100" height="40" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" />
      <rect x="150" y="90" width="40" height="20" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="2" />
      <line x1="50" y1="100" x2="190" y2="100" stroke="#EF4444" strokeWidth="4" />
      <text x="100" y="140" textAnchor="middle" fill="white" fontSize="12">Male Connector (+)</text>
      {/* Female */}
      <rect x="250" y="80" width="100" height="40" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" />
      <path d="M 250 80 L 210 80 L 210 120 L 250 120" fill="none" stroke="white" strokeWidth="2" />
      <line x1="250" y1="100" x2="350" y2="100" stroke="#1F2937" strokeWidth="4" />
      <text x="300" y="140" textAnchor="middle" fill="white" fontSize="12">Female Connector (−)</text>
      {/* Locking ring zoom callout */}
      <circle cx="210" cy="100" r="25" fill="none" stroke="#F5A623" strokeWidth="2" strokeDasharray="4,2" />
      <line x1="225" y1="80" x2="280" y2="40" stroke="#F5A623" strokeWidth="1" />
      <circle cx="310" cy="40" r="30" fill="#0B1F3A" stroke="#F5A623" strokeWidth="2" />
      <text x="310" y="45" textAnchor="middle" fill="#F5A623" fontSize="10">Locking mechanism</text>
    </svg>
  );
}

function SVGStringWiring({ Voc }) {
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      <text x="200" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">String Wiring (Series Connection)</text>
      {/* Panel 1 */}
      <rect x="50" y="60" width="100" height="80" fill="rgba(59,130,246,0.1)" stroke="#3B82F6" strokeWidth="2" />
      <text x="100" y="100" textAnchor="middle" fill="#3B82F6" fontSize="14">Panel 1</text>
      <text x="70" y="130" fill="#EF4444" fontSize="12">+</text>
      <text x="130" y="130" fill="#1F2937" fontSize="12">−</text>
      {/* Panel 2 */}
      <rect x="250" y="60" width="100" height="80" fill="rgba(59,130,246,0.1)" stroke="#3B82F6" strokeWidth="2" />
      <text x="300" y="100" textAnchor="middle" fill="#3B82F6" fontSize="14">Panel 2</text>
      <text x="270" y="130" fill="#EF4444" fontSize="12">+</text>
      <text x="330" y="130" fill="#1F2937" fontSize="12">−</text>
      {/* Series Connection */}
      <path d="M 130 140 L 130 160 L 270 160 L 270 140" fill="none" stroke="#EF4444" strokeWidth="3" />
      {/* Main leads */}
      <line x1="70" y1="140" x2="70" y2="180" stroke="#EF4444" strokeWidth="3" />
      <line x1="330" y1="140" x2="330" y2="180" stroke="#1F2937" strokeWidth="3" />
      <text x="200" y="180" textAnchor="middle" fill="#F5A623" fontSize="14" fontWeight="bold">String Voltage: {Voc}V</text>
    </svg>
  );
}

function SVGInverterMount() {
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      <text x="200" y="30" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Inverter Clearances</text>
      <rect x="140" y="60" width="120" height="100" fill="rgba(245,166,35,0.1)" stroke="#F5A623" strokeWidth="2" />
      <text x="200" y="110" textAnchor="middle" fill="#F5A623" fontSize="14">Inverter</text>
      {/* Clearances */}
      <line x1="140" y1="40" x2="260" y2="40" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" />
      <text x="200" y="35" textAnchor="middle" fill="#3B82F6" fontSize="10">Min 300mm top</text>
      
      <line x1="120" y1="60" x2="120" y2="160" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" />
      <text x="115" y="110" textAnchor="end" fill="#3B82F6" fontSize="10">Min 300mm</text>
      
      <line x1="280" y1="60" x2="280" y2="160" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" />
      <text x="285" y="110" textAnchor="start" fill="#3B82F6" fontSize="10">Min 300mm</text>

      <line x1="140" y1="180" x2="260" y2="180" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" />
      <text x="200" y="195" textAnchor="middle" fill="#3B82F6" fontSize="10">Min 500mm bottom clearance</text>

      <rect x="180" y="55" width="40" height="5" fill="white" />
      <text x="200" y="50" textAnchor="middle" fill="white" fontSize="8">Mounting Bracket</text>
    </svg>
  );
}

function SVGBatteryBMS() {
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      <text x="200" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Battery & BMS Architecture</text>
      
      <rect x="50" y="40" width="300" height="140" fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth="2" />
      <text x="330" y="170" textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">Battery Rack</text>

      {/* Cells */}
      <rect x="70" y="60" width="100" height="40" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="2" />
      <text x="120" y="85" textAnchor="middle" fill="#EF4444" fontSize="12">Cell Block 1</text>
      
      <rect x="70" y="120" width="100" height="40" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="2" />
      <text x="120" y="145" textAnchor="middle" fill="#EF4444" fontSize="12">Cell Block 2</text>

      {/* BMS */}
      <rect x="230" y="60" width="100" height="100" fill="rgba(59,130,246,0.2)" stroke="#3B82F6" strokeWidth="2" />
      <text x="280" y="90" textAnchor="middle" fill="#3B82F6" fontSize="14" fontWeight="bold">BMS</text>
      <rect x="250" y="100" width="60" height="20" fill="#0B1F3A" stroke="#3B82F6" strokeWidth="1" />
      <text x="280" y="115" textAnchor="middle" fill="#27AE60" fontSize="12" fontWeight="bold">SOC: 100%</text>

      {/* Wiring */}
      <line x1="170" y1="80" x2="230" y2="80" stroke="white" strokeWidth="2" strokeDasharray="4,2" />
      <line x1="170" y1="140" x2="230" y2="140" stroke="white" strokeWidth="2" strokeDasharray="4,2" />
      <text x="200" y="75" textAnchor="middle" fill="white" fontSize="8">Voltage Sense</text>

      <line x1="330" y1="70" x2="380" y2="70" stroke="#EF4444" strokeWidth="4" />
      <text x="385" y="75" fill="#EF4444" fontSize="12">DC+</text>
      <line x1="330" y1="150" x2="380" y2="150" stroke="#1F2937" strokeWidth="4" />
      <text x="385" y="155" fill="#1F2937" fontSize="12">DC−</text>
    </svg>
  );
}

function SVGPlaceholder({ title }) {
  return (
    <svg viewBox="0 0 400 200" width="100%" style={{ background: '#0B1F3A', borderRadius: 8 }}>
      <text x="200" y="100" textAnchor="middle" fill="white" fontSize="14">{title}</text>
    </svg>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

export default function SystemAssembly({ specs, state, sector, systemType, products }) {
  const [modalImg, setModalImg] = useState(null);
  
  const hasBattery = systemType && !systemType.toLowerCase().includes('grid-tied only') && (specs?.batteryKWh > 0);
  const hasGrid = systemType && !systemType.toLowerCase().includes('off-grid');

  const Voc = Math.round(Math.ceil((specs?.panels || 12) / Math.max(1, Math.ceil((specs?.panels || 12) / 15))) * 49.5);

  const stepsData = [
    {
      id: 'roof',
      title: 'Roof Survey & Marking',
      stage: 'mechanical',
      photo: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
      svg: <SVGPlaceholder title="Roof Dimensions & Marking" />,
      desc: 'Measure roof dimensions accurately. Check for shading from chimneys or trees. Mark rafter locations for secure mounting.',
      tools: ['Tape Measure', 'Chalk Line', 'Stud Finder'],
      time: '1-2 hours',
      safety: 'Fall protection required (harness)',
    },
    {
      id: 'rails',
      title: 'Mounting Rails Installation',
      stage: 'mechanical',
      photo: 'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&q=80',
      svg: <SVGPlaceholder title="Mounting Rail Profile" />,
      desc: 'Install L-feet brackets to rafters. Secure aluminum rails to brackets and ensure they are perfectly level.',
      tools: ['Drill', 'Impact Driver', 'Level'],
      torque: '12-15 Nm for rail clamps',
      time: '2-4 hours',
    },
    {
      id: 'panels',
      title: 'Panel Mounting & Grounding',
      stage: 'mechanical',
      photo: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
      svg: <SVGPlaceholder title="Panel Grounding Layout" />,
      desc: 'Lift panels onto rails. Secure with mid and end clamps. Ensure continuous grounding across all panel frames.',
      tools: ['Torque Wrench', 'Wrench'],
      torque: '14 Nm for panel clamps',
      time: '3-6 hours',
    },
    {
      id: 'mc4',
      title: 'String Wiring & MC4 Connectors',
      stage: 'dc',
      photo: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&q=80',
      svg: <SVGMC4 />,
      desc: 'Connect panels in series to form strings. Crimp MC4 connectors to homerun cables. Perform a pull test on all crimps.',
      tools: ['Wire Stripper', 'Crimper', 'Multimeter'],
      inspectorTip: 'Inspector will check for minimum 50N pull test on MC4s.',
      time: '2-3 hours',
    },
    {
      id: 'combiner',
      title: 'Combiner Box Installation',
      stage: 'dc',
      photo: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
      svg: <SVGStringWiring Voc={Voc} />,
      desc: 'Route DC strings to the combiner box. Install string fuses and surge protection devices (SPD).',
      tools: ['Screwdriver', 'Multimeter'],
      safety: 'Verify 0V before touching busbars (open isolator)',
      time: '1-2 hours',
    },
    {
      id: 'inverter',
      title: 'Inverter Mounting',
      stage: 'dc',
      photo: 'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=800&q=80',
      svg: <SVGInverterMount />,
      desc: 'Mount the inverter bracket to a solid wall. Hang the inverter and ensure minimum ventilation clearances are met.',
      tools: ['Drill', 'Level', 'Wrench'],
      inspectorTip: 'Clearances must match manufacturer specs (usually 300mm+).',
      time: '2 hours',
    }
  ];

  if (hasBattery) {
    stepsData.push({
      id: 'battery',
      title: 'Battery & BMS Installation',
      stage: 'dc',
      photo: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80',
      svg: <SVGBatteryBMS />,
      desc: 'Position battery rack. Connect heavy-gauge DC cables to inverter. Connect BMS communication wires.',
      tools: ['Torque Wrench', 'Crimper'],
      torque: 'Check manual for battery terminal torque (typically large).',
      safety: 'Extreme short-circuit current risk — use insulated tools.',
      time: '2-3 hours',
    });
  }

  stepsData.push({
    id: 'ac',
    title: 'AC Wiring & Distribution Board',
    stage: 'ac',
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    svg: <SVGPlaceholder title="AC MDB Layout" />,
    desc: 'Connect inverter AC output to the AC isolator, then to the main distribution board (MDB). Install the grid-tie breaker.',
    tools: ['Screwdriver', 'Multimeter', 'Wire Stripper'],
    safety: 'Isolate main grid power before opening MDB.',
    time: '2-4 hours',
  });

  stepsData.push({
    id: 'commissioning',
    title: 'Commissioning & Monitoring',
    stage: 'ac',
    photo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    svg: <SVGPlaceholder title="App Monitoring Setup" />,
    desc: 'Power on sequence: Battery -> DC -> AC. Connect inverter to Wi-Fi and configure the monitoring app.',
    tools: ['Smartphone/Laptop', 'Multimeter'],
    inspectorTip: 'Verify anti-islanding protection works (shutdown on grid loss).',
    time: '1-2 hours',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Diagram */}
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: 20 }}>System Physical Layout</h3>
        <PhysicalOverview specs={specs} hasBattery={hasBattery} hasGrid={hasGrid} />
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {stepsData.map((step, index) => {
          const st = STAGE[step.stage];
          return (
            <div key={step.id} style={{ display: 'flex', flexWrap: 'wrap', background: '#0B1F3A', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              
              {/* Left Side: Visuals (60%) */}
              <div style={{ flex: '1 1 60%', minWidth: 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {/* Photo Layer */}
                <div style={{ position: 'relative', height: 280, backgroundImage: `url(${step.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {/* Gradient Overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, #0B1F3A, transparent)' }} />
                  {/* Badge */}
                  <div style={{ position: 'absolute', top: 16, right: 16, background: st.color, color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>
                    {st.label}
                  </div>
                  {/* Expand button */}
                  <button onClick={() => setModalImg(step.photo)} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    Expand Photo
                  </button>
                </div>

                {/* SVG Layer */}
                <div style={{ padding: '1rem', background: '#0B1F3A', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {step.svg}
                </div>
              </div>

              {/* Right Side: Information (40%) */}
              <div style={{ flex: '1 1 40%', minWidth: 280, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: `1px solid ${st.border}` }}>
                    {index + 1}
                  </div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: 20 }}>{step.title}</h4>
                </div>
                
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><strong>Estimated Time:</strong> {step.time}</div>
                  {step.tools && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}><strong>Tools Needed:</strong> {step.tools.join(', ')}</div>}
                  {step.safety && <div style={{ fontSize: 12, color: '#EF4444' }}><strong>Safety Warning:</strong> {step.safety}</div>}
                  {step.torque && <div style={{ fontSize: 12, color: '#F5A623' }}><strong>Torque Spec:</strong> {step.torque}</div>}
                  {step.inspectorTip && <div style={{ fontSize: 12, color: '#16A34A' }}><strong>Inspector Tip:</strong> {step.inspectorTip}</div>}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', fontSize: 14 }}>
                    <input type="checkbox" style={{ width: 20, height: 20, accentColor: '#16A34A' }} />
                    Mark as completed
                  </label>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      {/* Fullscreen Photo Modal */}
      {modalImg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setModalImg(null)}>
          <img src={modalImg} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain' }} alt="Expanded view" />
          <div style={{ position: 'absolute', top: 20, right: 20, color: 'white', cursor: 'pointer', fontSize: 24, fontWeight: 'bold' }}>×</div>
        </div>
      )}
    </div>
  )
}
