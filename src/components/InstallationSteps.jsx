// ── Solarah Interactive Installation Guide ────────────────────────────────────
// Phase-coded, system-aware, with SVG illustrations, tool lists, and progress tracking.

import { useState } from 'react'
import { useReveal } from '../lib/useReveal'

// ── Phase colors ──────────────────────────────────────────────────────────────
const PHASE = {
  structural: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Structural' },
  dc:         { color: '#E74C3C', bg: 'rgba(231,76,60,0.08)',  border: 'rgba(231,76,60,0.2)',  label: 'DC Electrical' },
  ac:         { color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)', label: 'AC Electrical' },
  commission: { color: '#27AE60', bg: 'rgba(39,174,96,0.08)',  border: 'rgba(39,174,96,0.2)',  label: 'Commissioning' },
}

// ── SVG Illustrations (200×140) ───────────────────────────────────────────────

function IllustSiteSurvey() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      {/* Sky */}
      <rect width="200" height="90" fill="#0B1F3A" />
      {/* Sun */}
      <circle cx="160" cy="28" r="14" fill="#F5A623" opacity="0.3" />
      <circle cx="160" cy="28" r="8" fill="#F5A623" opacity="0.7" />
      {/* Roof outline */}
      <polygon points="30,90 100,45 170,90" fill="none" stroke="#3B82F6" strokeWidth="2" />
      <rect x="30" y="90" width="140" height="50" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      {/* Measurement lines */}
      <line x1="40" y1="85" x2="160" y2="85" stroke="#F5A623" strokeWidth="1" strokeDasharray="4,3" />
      <text x="100" y="82" textAnchor="middle" fontSize="8" fill="#F5A623">← 12m →</text>
      {/* Shading analysis rays */}
      {[25, 35, 45].map((a, i) => (
        <line key={i} x1="160" y1="28" x2={90 + i * 20} y2={70 + i * 5} stroke="#F5A623" strokeWidth="0.6" opacity="0.4" strokeDasharray="3,3" />
      ))}
      {/* Compass */}
      <circle cx="25" cy="125" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      <text x="25" y="117" textAnchor="middle" fontSize="6" fill="#F5A623">N</text>
      <text x="25" y="135" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">S</text>
    </svg>
  )
}

function IllustStructural() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Roof cross-section */}
      <polygon points="20,80 100,30 180,80" fill="none" stroke="#3B82F6" strokeWidth="2" />
      {/* Rafters */}
      {[40, 65, 90, 115, 140, 165].map((x, i) => {
        const y1 = 80 - (80 - 30) * Math.abs(100 - x) / 80 + (x < 100 ? (100 - x) * 0.625 : (x - 100) * 0.625)
        return <line key={i} x1={x} y1={Math.min(30 + Math.abs(100 - x) * 0.625, 80)} x2={x} y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      })}
      {/* Load arrows */}
      {[60, 100, 140].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="15" x2={x} y2={35 + Math.abs(100 - x) * 0.3} stroke="#E74C3C" strokeWidth="1" />
          <polygon points={`${x - 3},${35 + Math.abs(100 - x) * 0.3 - 5} ${x},${35 + Math.abs(100 - x) * 0.3} ${x + 3},${35 + Math.abs(100 - x) * 0.3 - 5}`} fill="#E74C3C" />
        </g>
      ))}
      <text x="100" y="12" textAnchor="middle" fontSize="7" fill="#E74C3C">Load analysis</text>
      {/* Wall */}
      <rect x="20" y="80" width="160" height="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Check mark */}
      <circle cx="170" cy="120" r="10" fill="rgba(39,174,96,0.15)" stroke="#27AE60" strokeWidth="1" />
      <polyline points="164,120 168,124 176,116" fill="none" stroke="#27AE60" strokeWidth="1.5" />
    </svg>
  )
}

function IllustMounting() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Roof surface */}
      <polygon points="10,100 100,40 190,100" fill="rgba(59,130,246,0.05)" stroke="#3B82F6" strokeWidth="1.5" />
      {/* Rails */}
      <line x1="35" y1="82" x2="165" y2="82" stroke="#F5A623" strokeWidth="2.5" />
      <line x1="40" y1="68" x2="160" y2="68" stroke="#F5A623" strokeWidth="2.5" />
      {/* Brackets (L-feet) */}
      {[50, 80, 110, 140].map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y="78" width="6" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1={x} y1="86" x2={x} y2="92" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <rect x={x - 3} y="64" width="6" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </g>
      ))}
      {/* Waterproofing detail */}
      <circle cx="80" cy="90" r="6" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x="80" y="105" textAnchor="middle" fontSize="6" fill="#3B82F6">Flashing</text>
      {/* Tilt angle indicator */}
      <path d="M160,100 L160,75 L175,100 Z" fill="none" stroke="#F5A623" strokeWidth="0.8" />
      <text x="168" y="95" fontSize="6" fill="#F5A623">25°</text>
    </svg>
  )
}

function IllustPanels({ panelName }) {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Panels on racking */}
      {[0, 1, 2, 3].map(i => {
        const x = 20 + i * 42
        return (
          <g key={i}>
            <rect x={x} y="25" width="38" height="65" rx="1" fill="rgba(59,130,246,0.08)" stroke="#3B82F6" strokeWidth="1.2" />
            {/* Cell grid */}
            {[0, 1, 2].map(r => [0, 1].map(c => (
              <rect key={`${r}${c}`} x={x + 3 + c * 17} y={30 + r * 20} width="14" height="16" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
            )))}
            {/* Diagonal (PV symbol) */}
            <line x1={x} y1="90" x2={x + 38} y2="25" stroke="rgba(245,166,35,0.3)" strokeWidth="0.5" />
          </g>
        )
      })}
      {/* MC4 connectors */}
      <circle cx="58" cy="95" r="3" fill="#E74C3C" opacity="0.6" />
      <circle cx="62" cy="95" r="3" fill="#1a1a2e" opacity="0.8" />
      <text x="60" y="108" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.35)">MC4</text>
      {/* Rail */}
      <line x1="15" y1="92" x2="185" y2="92" stroke="#F5A623" strokeWidth="2" />
      {/* Panel label */}
      <text x="100" y="125" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)">{panelName || '400W Mono PERC'}</text>
    </svg>
  )
}

function IllustDCCabling() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Conduit pipe */}
      <rect x="30" y="50" width="140" height="10" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* DC+ cable (red) */}
      <path d="M30,53 C70,53 90,48 170,53" fill="none" stroke="#E74C3C" strokeWidth="2" />
      {/* DC- cable (black) */}
      <path d="M30,57 C70,57 90,62 170,57" fill="none" stroke="#555" strokeWidth="2" />
      {/* Labels */}
      <text x="100" y="45" textAnchor="middle" fontSize="7" fill="#E74C3C">DC+ (4mm² solar cable)</text>
      <text x="100" y="75" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)">DC− (4mm²)</text>
      {/* Combiner box */}
      <rect x="15" y="38" width="25" height="30" rx="2" fill="rgba(231,76,60,0.08)" stroke="#E74C3C" strokeWidth="1" />
      <text x="27" y="56" textAnchor="middle" fontSize="5" fill="#E74C3C">CB</text>
      {/* Inverter end */}
      <rect x="165" y="38" width="25" height="30" rx="2" fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" strokeWidth="1" />
      <text x="177" y="56" textAnchor="middle" fontSize="5" fill="#8B5CF6">INV</text>
      {/* UV conduit label */}
      <text x="100" y="100" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">UV-resistant conduit</text>
      {/* Cable tie icons */}
      {[55, 90, 125].map((x, i) => (
        <rect key={i} x={x - 1} y="48" width="2" height="14" rx="1" fill="rgba(255,255,255,0.15)" />
      ))}
    </svg>
  )
}

function IllustInverter({ invName }) {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Wall */}
      <rect x="10" y="10" width="180" height="120" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Brick pattern */}
      {[30, 60, 90].map(y => (
        <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
      ))}
      {/* Inverter box */}
      <rect x="55" y="25" width="90" height="70" rx="4" fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" strokeWidth="1.5" />
      {/* Screen */}
      <rect x="70" y="35" width="60" height="25" rx="2" fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" strokeWidth="0.8" />
      <text x="100" y="50" textAnchor="middle" fontSize="7" fontWeight="700" fill="#8B5CF6">MPPT</text>
      {/* Status LED */}
      <circle cx="75" cy="72" r="3" fill="#27AE60" opacity="0.8" />
      <text x="85" y="74" fontSize="6" fill="rgba(255,255,255,0.3)">Online</text>
      {/* DC input cables (left) */}
      <line x1="30" y1="50" x2="55" y2="50" stroke="#E74C3C" strokeWidth="1.5" />
      <line x1="30" y1="56" x2="55" y2="56" stroke="#555" strokeWidth="1.5" />
      <text x="30" y="45" fontSize="6" fill="#E74C3C">DC in</text>
      {/* AC output (right) */}
      <line x1="145" y1="53" x2="175" y2="53" stroke="#F5A623" strokeWidth="1.5" />
      <text x="175" y="50" fontSize="6" fill="#F5A623">AC out</text>
      {/* Model name */}
      <text x="100" y="110" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)">{invName || 'Hybrid Inverter'}</text>
      {/* Ventilation arrows */}
      {[65, 100, 135].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="100" x2={x} y2="107" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
          <polygon points={`${x - 2},107 ${x},111 ${x + 2},107`} fill="rgba(255,255,255,0.1)" />
        </g>
      ))}
    </svg>
  )
}

function IllustBattery({ batName }) {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Wall */}
      <rect x="10" y="10" width="180" height="120" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Battery unit */}
      <rect x="50" y="20" width="100" height="80" rx="4" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1.5" />
      {/* Cell modules stacked */}
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x="58" y={28 + i * 17} width="84" height="13" rx="2" fill="rgba(245,166,35,0.08)" stroke="rgba(245,166,35,0.3)" strokeWidth="0.8" />
      ))}
      {/* Terminal posts */}
      <rect x="65" y="15" width="8" height="8" rx="1" fill="#E74C3C" opacity="0.6" />
      <text x="69" y="13" textAnchor="middle" fontSize="6" fill="#E74C3C">+</text>
      <rect x="127" y="15" width="8" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <text x="131" y="13" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.4)">−</text>
      {/* Ventilation symbol */}
      <text x="100" y="115" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">Ventilated area · Level surface</text>
      {/* Model name */}
      <text x="100" y="128" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)">{batName || 'LFP Battery'}</text>
    </svg>
  )
}

function IllustBMS() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* BMS unit */}
      <rect x="25" y="30" width="65" height="50" rx="3" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1.2" />
      <text x="57" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#F5A623">BMS</text>
      <text x="57" y="62" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">Management</text>
      {/* Inverter */}
      <rect x="115" y="30" width="65" height="50" rx="3" fill="rgba(139,92,246,0.06)" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="147" y="50" textAnchor="middle" fontSize="9" fontWeight="700" fill="#8B5CF6">INV</text>
      <text x="147" y="62" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">Inverter</text>
      {/* Communication cable */}
      <line x1="90" y1="55" x2="115" y2="55" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="102" y="50" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">RS485</text>
      {/* Signal indicators */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={35 + i * 12} y={72} cy="72" r="2" fill={i === 2 ? '#27AE60' : 'rgba(255,255,255,0.1)'} />
      ))}
      <text x="57" y="90" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">Cell balancing · SoC monitoring</text>
    </svg>
  )
}

function IllustBatDC() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Battery */}
      <rect x="15" y="35" width="55" height="45" rx="3" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1.2" />
      <text x="42" y="55" textAnchor="middle" fontSize="8" fontWeight="700" fill="#F5A623">BAT</text>
      {/* Fuse/breaker */}
      <rect x="85" y="48" width="20" height="12" rx="2" fill="none" stroke="#E74C3C" strokeWidth="1.2" />
      <line x1="90" y1="54" x2="100" y2="54" stroke="#E74C3C" strokeWidth="1" />
      <text x="95" y="45" textAnchor="middle" fontSize="6" fill="#E74C3C">FUSE</text>
      {/* Inverter */}
      <rect x="120" y="35" width="65" height="45" rx="3" fill="rgba(139,92,246,0.06)" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="152" y="55" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8B5CF6">INV</text>
      <text x="152" y="68" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">BAT port</text>
      {/* DC cables */}
      <line x1="70" y1="50" x2="85" y2="50" stroke="#E74C3C" strokeWidth="2" />
      <line x1="70" y1="58" x2="85" y2="58" stroke="#555" strokeWidth="2" />
      <line x1="105" y1="54" x2="120" y2="54" stroke="#E74C3C" strokeWidth="2" />
      {/* Warning triangle */}
      <polygon points="95,100 85,115 105,115" fill="none" stroke="#F5A623" strokeWidth="1.2" />
      <text x="95" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill="#F5A623">!</text>
      <text x="95" y="128" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">Check polarity</text>
    </svg>
  )
}

function IllustACBoard() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Distribution board */}
      <rect x="50" y="15" width="100" height="100" rx="3" fill="rgba(245,166,35,0.04)" stroke="#F5A623" strokeWidth="1.5" />
      {/* Door hinge */}
      <line x1="50" y1="25" x2="50" y2="105" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      {/* Breakers */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const x = 65 + (i % 2) * 40
        const y = 25 + Math.floor(i / 2) * 28
        const isSolar = i === 0
        return (
          <g key={i}>
            <rect x={x} y={y} width="30" height="20" rx="2" fill={isSolar ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.03)'}
              stroke={isSolar ? '#F5A623' : 'rgba(255,255,255,0.12)'} strokeWidth="0.8" />
            <line x1={x + 8} y1={y + 5} x2={x + 22} y2={y + 15} stroke={isSolar ? '#F5A623' : 'rgba(255,255,255,0.2)'} strokeWidth="1" />
            {isSolar && <text x={x + 15} y={y + 30} textAnchor="middle" fontSize="5" fill="#F5A623">Solar CB</text>}
          </g>
        )
      })}
      {/* Incoming AC cable */}
      <line x1="30" y1="65" x2="50" y2="65" stroke="#F5A623" strokeWidth="2" />
      <text x="20" y="62" textAnchor="middle" fontSize="6" fill="#F5A623">AC</text>
      {/* Label */}
      <text x="100" y="130" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">Main Distribution Board</text>
    </svg>
  )
}

function IllustGrid() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Meter box */}
      <rect x="20" y="25" width="60" height="75" rx="3" fill="rgba(99,102,241,0.06)" stroke="#6366F1" strokeWidth="1.2" />
      <circle cx="50" cy="55" r="15" fill="none" stroke="#6366F1" strokeWidth="1" />
      <text x="50" y="58" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6366F1">kWh</text>
      <text x="50" y="82" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">Export meter</text>
      {/* Grid lines (power poles) */}
      <line x1="100" y1="15" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      <line x1="80" y1="30" x2="120" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <line x1="80" y1="50" x2="120" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      {/* Connection */}
      <line x1="80" y1="62" x2="100" y2="62" stroke="#6366F1" strokeWidth="1.5" />
      {/* DNO approval stamp */}
      <rect x="130" y="40" width="55" height="30" rx="3" fill="rgba(39,174,96,0.06)" stroke="#27AE60" strokeWidth="1" />
      <text x="157" y="54" textAnchor="middle" fontSize="7" fontWeight="700" fill="#27AE60">DNO</text>
      <text x="157" y="64" textAnchor="middle" fontSize="5" fill="rgba(39,174,96,0.6)">Approved</text>
      {/* Cable from house */}
      <path d="M50,100 L50,120 L157,120 L157,100" fill="none" stroke="#6366F1" strokeWidth="1" strokeDasharray="4,3" />
    </svg>
  )
}

function IllustCommission() {
  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ display: 'block' }}>
      <rect width="200" height="140" fill="#0B1F3A" />
      {/* Laptop / monitoring screen */}
      <rect x="45" y="20" width="110" height="65" rx="3" fill="rgba(39,174,96,0.04)" stroke="#27AE60" strokeWidth="1.2" />
      {/* Graph bars */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <rect key={i} x={58 + i * 13} y={55 - [18, 25, 30, 35, 28, 22, 32][i]} width="8"
          height={[18, 25, 30, 35, 28, 22, 32][i]} rx="1" fill="rgba(39,174,96,0.3)" stroke="#27AE60" strokeWidth="0.5" />
      ))}
      <text x="100" y="72" textAnchor="middle" fontSize="6" fill="#27AE60">Daily generation (kWh)</text>
      {/* Laptop base */}
      <rect x="35" y="85" width="130" height="6" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      {/* Wi-Fi icon */}
      {[6, 10, 14].map((r, i) => (
        <path key={i} d={`M100,105 A${r},${r} 0 0 1 ${100 + r},${105 + r}`} fill="none" stroke="#27AE60" strokeWidth="0.8" opacity={0.3 + i * 0.25} transform={`rotate(-45, 100, 105)`} />
      ))}
      <circle cx="100" cy="105" r="1.5" fill="#27AE60" />
      <text x="100" y="130" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">Monitoring active</text>
    </svg>
  )
}

// ── Tool icons (tiny SVGs) ────────────────────────────────────────────────────

function ToolIcon({ name }) {
  const c = 'rgba(255,255,255,0.4)'
  const icons = {
    'Tape measure': <><line x1="2" y1="10" x2="14" y2="10" stroke={c} strokeWidth="1.2" /><rect x="1" y="4" width="5" height="12" rx="1" fill="none" stroke={c} strokeWidth="0.8" /></>,
    'Level': <><rect x="1" y="6" width="14" height="4" rx="1" fill="none" stroke={c} strokeWidth="0.8" /><circle cx="8" cy="8" r="1.5" fill={c} /></>,
    'Drill': <><rect x="2" y="4" width="8" height="8" rx="1" fill="none" stroke={c} strokeWidth="0.8" /><line x1="10" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1.5" /></>,
    'Wrench': <><circle cx="5" cy="5" r="3" fill="none" stroke={c} strokeWidth="0.8" /><line x1="7" y1="7" x2="14" y2="14" stroke={c} strokeWidth="1.2" /></>,
    'Multimeter': <><rect x="3" y="1" width="10" height="14" rx="2" fill="none" stroke={c} strokeWidth="0.8" /><circle cx="8" cy="7" r="3" fill="none" stroke={c} strokeWidth="0.6" /></>,
    'Crimper': <><line x1="2" y1="14" x2="8" y2="6" stroke={c} strokeWidth="1.2" /><line x1="14" y1="14" x2="8" y2="6" stroke={c} strokeWidth="1.2" /></>,
    'Torque wrench': <><line x1="2" y1="12" x2="12" y2="2" stroke={c} strokeWidth="1.5" /><circle cx="13" cy="2" r="2" fill="none" stroke={c} strokeWidth="0.8" /></>,
    'Screwdriver': <><line x1="8" y1="2" x2="8" y2="12" stroke={c} strokeWidth="1.5" /><rect x="6" y="12" width="4" height="3" rx="0.5" fill="none" stroke={c} strokeWidth="0.6" /></>,
    'Cable cutter': <><circle cx="6" cy="6" r="4" fill="none" stroke={c} strokeWidth="0.8" /><circle cx="10" cy="10" r="4" fill="none" stroke={c} strokeWidth="0.8" /></>,
    'PPE': <><path d="M4,4 Q8,1 12,4 L12,10 Q8,13 4,10 Z" fill="none" stroke={c} strokeWidth="0.8" /></>,
  }
  const icon = icons[name]
  if (!icon) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 10, marginBottom: 4 }}>
      <svg viewBox="0 0 16 16" width="14" height="14">{icon}</svg>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{name}</span>
    </div>
  )
}

// ── Step definitions ──────────────────────────────────────────────────────────

function getSteps(specs, products, sector) {
  const panelName = products?.panels?.name || `${specs?.panels || 6}× 400W Panel`
  const invName = products?.inverter?.name || 'Hybrid Inverter'
  const batName = products?.battery?.name || `${specs?.batteryKWh || 0} kWh LFP`

  return {
    base: [
      {
        id: 'survey', phase: 'structural', title: 'Site survey & shading analysis',
        desc: 'Inspect the installation site for structural integrity, measure roof dimensions, and perform a shading analysis using a solar pathfinder or drone survey throughout the day.',
        time: '2–3 hours', tools: ['Tape measure', 'Level'],
        warning: null, Illust: IllustSiteSurvey,
      },
      {
        id: 'structural', phase: 'structural', title: 'Structural assessment',
        desc: 'Verify the roof or ground mount can support the array weight. Check rafter spacing, age, and material. For ground mounts, assess soil and drainage.',
        time: '1–2 hours', tools: ['Tape measure', 'Level'],
        warning: 'A structural engineer must sign off if the roof is older than 15 years or the system exceeds 10 kWp.',
        Illust: IllustStructural,
      },
      {
        id: 'mounting', phase: 'structural', title: 'Mounting system installation',
        desc: 'Install aluminium racking rails, L-feet brackets, and clamps. Seal all roof penetrations with EPDM flashing. Set tilt angle per engineering report.',
        time: '3–5 hours', tools: ['Drill', 'Wrench', 'Level', 'Torque wrench'],
        warning: 'All roof penetrations must be sealed with appropriate flashing to prevent water ingress. Work at height requires harness.',
        Illust: IllustMounting,
      },
      {
        id: 'panels', phase: 'dc', title: 'Panel installation & string wiring',
        desc: `Mount ${panelName} panels onto rails. Connect in series per string using MC4 connectors. Verify Voc and polarity at each string before proceeding.`,
        time: '4–8 hours', tools: ['Wrench', 'Multimeter', 'Crimper', 'PPE'],
        warning: 'Panels produce voltage under light — cover panels during wiring or work in low-light conditions. MC4 connectors must click firmly.',
        Illust: () => <IllustPanels panelName={panelName} />,
      },
      {
        id: 'dc_cable', phase: 'dc', title: 'DC cabling to inverter',
        desc: 'Route DC+ and DC− cables from the string combiner box to the inverter in UV-resistant conduit. Label all cables. Crimp and terminate with correct lugs.',
        time: '2–3 hours', tools: ['Cable cutter', 'Crimper', 'Multimeter', 'Screwdriver'],
        warning: 'DC arcs are extremely dangerous and cannot be self-extinguished like AC. Double-check all crimps.',
        Illust: IllustDCCabling,
      },
      {
        id: 'inverter', phase: 'dc', title: 'Inverter mounting & DC connection',
        desc: `Mount ${invName} in a well-ventilated, shaded location. Connect DC string inputs. Verify open-circuit voltage matches design before switching on.`,
        time: '2–4 hours', tools: ['Drill', 'Screwdriver', 'Multimeter', 'Torque wrench'],
        warning: 'Ensure DC isolator is OFF before connecting any cables. Never connect DC under load.',
        Illust: () => <IllustInverter invName={invName} />,
      },
    ],
    battery: [
      {
        id: 'battery', phase: 'dc', title: 'Battery bank installation',
        desc: `Install ${batName} in a cool, dry, ventilated space. Ensure mounting surface is level and rated for the weight. Maintain manufacturer clearances on all sides.`,
        time: '1–2 hours', tools: ['Level', 'Wrench', 'Screwdriver'],
        warning: 'Lithium batteries must not be installed in enclosed, unventilated spaces. Ensure fire suppression is accessible.',
        Illust: () => <IllustBattery batName={batName} />,
      },
      {
        id: 'bms', phase: 'dc', title: 'Battery BMS connection',
        desc: 'Connect the BMS communication cable (RS485/CAN) between battery and inverter. This enables cell balancing, SoC monitoring, and charge control.',
        time: '30–60 min', tools: ['Screwdriver'],
        warning: null, Illust: IllustBMS,
      },
      {
        id: 'bat_dc', phase: 'dc', title: 'Battery DC connection',
        desc: 'Connect battery DC cables to the inverter battery port via a DC fuse/breaker. Verify polarity and voltage before closing the breaker.',
        time: '1–2 hours', tools: ['Multimeter', 'Torque wrench', 'Crimper'],
        warning: 'Battery short circuits deliver thousands of amps instantly. Always install a DC breaker and fuse between battery and inverter.',
        Illust: IllustBatDC,
      },
    ],
    grid: [
      {
        id: 'ac_board', phase: 'ac', title: 'AC connection to distribution board',
        desc: `Connect the ${invName} AC output to the main distribution board via a dedicated solar circuit breaker. Size the breaker for maximum inverter output current.`,
        time: '1–2 hours', tools: ['Screwdriver', 'Multimeter', 'Cable cutter'],
        warning: 'All AC work must be performed by a licensed electrician. Disconnect mains before making connections.',
        Illust: IllustACBoard,
      },
      {
        id: 'grid', phase: 'ac', title: 'Grid connection & metering',
        desc: 'Install bidirectional export meter. Submit interconnection application to the DNO. Wait for utility approval before energizing.',
        time: '1–3 hours + approval wait', tools: ['Screwdriver', 'Multimeter'],
        warning: 'Do not energize until the utility has approved the grid connection. Anti-islanding protection must be verified.',
        Illust: IllustGrid,
      },
    ],
    commission: [
      {
        id: 'commission', phase: 'commission', title: 'System commissioning & monitoring',
        desc: 'Power on the system. Verify string voltages, inverter output power, battery charge rate, and grid export. Set up Wi-Fi monitoring app and configure alerts.',
        time: '1–2 hours', tools: ['Multimeter'],
        warning: null, Illust: IllustCommission,
      },
    ],
  }
}

// ── CSS for responsive layout ─────────────────────────────────────────────────
const CSS = `
.is-timeline{display:flex;gap:1.25rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:1rem;-webkit-overflow-scrolling:touch}
.is-timeline::-webkit-scrollbar{height:4px}
.is-timeline::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
.is-timeline .is-card{min-width:300px;max-width:340px;scroll-snap-align:start;flex-shrink:0}
@media(max-width:768px){
  .is-timeline{flex-direction:column;overflow-x:visible;padding-bottom:0}
  .is-timeline .is-card{min-width:0;max-width:none;width:100%}
}
.is-illust{border-radius:8px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.06);margin-bottom:10px}
`

// ── Main Component ────────────────────────────────────────────────────────────

export default function InstallationSteps({ specs, state, systemType: stProp, products, sector: sectorProp }) {
  const systemType = (stProp || state?.systemType || '').toLowerCase()
  const hasBattery = systemType.includes('grid-tied only') ? false : (specs?.batteryKWh || 0) > 0
  const isOffGrid = systemType.includes('off-grid')
  const hasGrid = !isOffGrid
  const sector = sectorProp || state?.sector || 'residential'

  const allSteps = getSteps(specs, products, sector)
  const steps = [
    ...allSteps.base,
    ...(hasBattery ? allSteps.battery : []),
    ...(hasGrid ? allSteps.grid : []),
    ...allSteps.commission,
  ]

  const [completed, setCompleted] = useState({})
  const [expanded, setExpanded] = useState(null) // for mobile accordion

  const toggle = (id) => setCompleted(prev => ({ ...prev, [id]: !prev[id] }))
  const doneCount = Object.values(completed).filter(Boolean).length
  const pct = Math.round((doneCount / steps.length) * 100)

  // Scroll-reveal for step cards
  const [revealRef, revealed] = useReveal(0.1)

  // Phase legend
  const phases = [...new Set(steps.map(s => s.phase))]

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '1.25rem' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            Installation guide
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
            Step-by-step installation
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {steps.length} steps · {hasBattery ? (hasGrid ? 'Hybrid' : 'Off-grid') : 'Grid-tied'} · {sector}
          </div>
        </div>
        {/* Phase legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {phases.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: PHASE[p].color }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{PHASE[p].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress tracker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{doneCount} of {steps.length} complete</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#27AE60' : '#F5A623' }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#27AE60' : '#F5A623', borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => toggle(s.id)} title={`Step ${i + 1}: ${s.title}`}
              style={{
                width: 18, height: 18, borderRadius: 4, border: 'none', cursor: 'pointer',
                background: completed[s.id] ? PHASE[s.phase].color : PHASE[s.phase].bg,
                color: completed[s.id] ? '#fff' : PHASE[s.phase].color,
                fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
              {completed[s.id] ? '✓' : i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Step cards — horizontal scroll on desktop, vertical on mobile */}
      <div className="is-timeline" ref={revealRef}>
        {steps.map((s, i) => {
          const phase = PHASE[s.phase]
          const isDone = completed[s.id]
          const isOpen = expanded === s.id
          const Illust = s.Illust

          return (
            <div key={s.id} className="is-card" style={{
              background: isDone ? 'rgba(39,174,96,0.04)' : 'rgba(255,255,255,0.03)',
              border: `0.5px solid ${isDone ? 'rgba(39,174,96,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, overflow: 'hidden',
              borderLeft: `3px solid ${phase.color}`,
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateX(0)' : 'translateX(40px)',
              transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
            }}>
              {/* Card header — clickable on mobile */}
              <div onClick={() => setExpanded(isOpen ? null : s.id)} style={{ cursor: 'pointer', padding: '12px 14px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: phase.color,
                      background: phase.bg, border: `0.5px solid ${phase.border}`,
                      borderRadius: 4, padding: '2px 7px',
                    }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: 9, color: phase.color, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                      {phase.label}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id) }}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${isDone ? '#27AE60' : 'rgba(255,255,255,0.15)'}`,
                      background: isDone ? 'rgba(39,174,96,0.15)' : 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isDone ? '#27AE60' : 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700,
                    }}>
                    {isDone ? '✓' : ''}
                  </button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6, textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1 }}>
                  {s.title}
                </div>
              </div>

              {/* Card body — always visible on desktop, toggle on mobile via CSS */}
              <div style={{ padding: '0 14px 14px' }}>
                {/* Illustration */}
                <div className="is-illust">
                  <Illust />
                </div>

                {/* Description */}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 10 }}>
                  {s.desc}
                </div>

                {/* Tools */}
                <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: s.warning ? 10 : 6 }}>
                  {s.tools.map(t => <ToolIcon key={t} name={t} />)}
                </div>

                {/* Time estimate */}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: s.warning ? 8 : 0 }}>
                  ⏱ Est. time: {s.time}
                </div>

                {/* Safety warning */}
                {s.warning && (
                  <div style={{
                    fontSize: 11, color: '#F5A623', background: 'rgba(245,166,35,0.06)',
                    border: '0.5px solid rgba(245,166,35,0.2)', borderRadius: 6, padding: '8px 10px',
                    display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45, marginTop: 6,
                  }}>
                    <svg viewBox="0 0 16 16" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}>
                      <polygon points="8,1 15,15 1,15" fill="none" stroke="#F5A623" strokeWidth="1.2" />
                      <text x="8" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="#F5A623">!</text>
                    </svg>
                    <span>{s.warning}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
