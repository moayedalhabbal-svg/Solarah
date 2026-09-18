// ── Solarah Physical Assembly Guide ───────────────────────────────────────────
// Three-stage visual assembly guide with SVG illustrations, interactive
// completion tracking, fullscreen zoom, and PDF export.

import { useState, useRef, useCallback } from 'react'
import jsPDF from 'jspdf'

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGE = {
  mechanical: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', label: 'Stage 1 — Mechanical', num: 1 },
  dc: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Stage 2 — DC Electrical', num: 2 },
  ac: { color: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.2)', label: 'Stage 3 — AC & Commissioning', num: 3 },
}

// ── Animated wire CSS ─────────────────────────────────────────────────────────
const ANIM_CSS = `
@keyframes sa-fade{from{opacity:0}to{opacity:1}}
@keyframes sa-flow{from{stroke-dashoffset:20}to{stroke-dashoffset:0}}
@keyframes sa-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.sa-flow-line{opacity:0;animation:sa-fade .5s ease-in .5s both,sa-flow .8s linear 1s infinite}
.sa-modal-bg{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:1rem}
.sa-modal-bg svg{max-width:100%;max-height:90vh;cursor:default}
.sa-expand{cursor:zoom-in;transition:transform .15s ease}
.sa-expand:hover{transform:scale(1.01)}
@media print{.sa-no-print{display:none!important}}
`

// ── Tool SVG icons ────────────────────────────────────────────────────────────
const TOOLS = {
  Wrench: <><circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth=".9" /><line x1="7" y1="7" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" /></>,
  Screwdriver: <><line x1="8" y1="2" x2="8" y2="11" stroke="currentColor" strokeWidth="1.5" /><rect x="6" y="11" width="4" height="4" rx=".5" fill="none" stroke="currentColor" strokeWidth=".7" /></>,
  Multimeter: <><rect x="3" y="1" width="10" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth=".8" /><circle cx="8" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth=".6" /></>,
  Crimper: <><line x1="2" y1="14" x2="8" y2="5" stroke="currentColor" strokeWidth="1.2" /><line x1="14" y1="14" x2="8" y2="5" stroke="currentColor" strokeWidth="1.2" /><line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth=".7" /></>,
  'Torque wrench': <><line x1="2" y1="13" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" /><circle cx="13" cy="2" r="2" fill="none" stroke="currentColor" strokeWidth=".8" /><text x="6" y="8" fontSize="4" fill="currentColor">Nm</text></>,
  Drill: <><rect x="2" y="4" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth=".8" /><line x1="10" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" /></>,
  Level: <><rect x="1" y="6" width="14" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth=".8" /><circle cx="8" cy="8" r="1.5" fill="currentColor" /></>,
  PPE: <><path d="M4,5Q8,1 12,5L12,11Q8,14 4,11Z" fill="none" stroke="currentColor" strokeWidth=".8" /></>,
  'Cable cutter': <><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth=".8" /><circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth=".8" /></>,
  'Impact driver': <><rect x="3" y="3" width="7" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth=".8" /><line x1="10" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" /></>,
}

function ToolChip({ name }) {
  const icon = TOOLS[name]
  if (!icon) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 8px 3px 5px', marginRight: 6, marginBottom: 4, color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
      <svg viewBox="0 0 16 16" width="13" height="13">{icon}</svg>
      {name}
    </span>
  )
}

// ── System overview SVG ───────────────────────────────────────────────────────

function SystemOverview({ specs, sector, hasBattery, hasGrid, isLargeIndustrial, products }) {
  const W = 700, H = 340
  const invName = products?.inverter?.name?.split(' ').slice(0, 3).join(' ') || 'Inverter'
  const panelName = products?.panels?.name?.split(' ').slice(0, 3).join(' ') || 'PV Panel'
  const batName = products?.battery?.name?.split(' ').slice(0, 2).join(' ') || 'LFP Battery'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <rect width={W} height={H} fill="#0B1F3A" rx="8" />
      {/* Roof area */}
      <polygon points="40,130 210,40 380,130" fill="rgba(59,130,246,0.04)" stroke="rgba(59,130,246,0.2)" strokeWidth="1" />
      {/* Panels on roof */}
      {[0, 1, 2, 3, 4].map(i => {
        const x = 75 + i * 55; return (
          <g key={i}>
            <rect x={x} y={65 + i * 3} width="48" height="30" rx="1" fill="rgba(59,130,246,0.1)" stroke="#3B82F6" strokeWidth="1" />
            <line x1={x} y1={95 + i * 3} x2={x + 48} y2={65 + i * 3} stroke="rgba(59,130,246,0.15)" strokeWidth=".5" />
          </g>
        )
      })}
      <text x="210" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="#3B82F6">{panelName} × {specs?.panels || 6}</text>
      {/* Wall */}
      <rect x="30" y="130" width="360" height="190" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.06)" strokeWidth=".5" />
      {/* Inverter on wall */}
      <rect x="160" y="160" width="70" height="50" rx="3" fill="rgba(139,92,246,0.08)" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="195" y="182" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8B5CF6">INV</text>
      <text x="195" y="195" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">{invName}</text>
      <text x="195" y="155" textAnchor="middle" fontSize="7" fill="#8B5CF6">{specs?.inverterKW || 5} kW</text>
      {/* Battery on floor */}
      {hasBattery && (
        <g>
          <rect x="60" y="250" width="80" height="55" rx="3" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1.2" />
          {[0, 1, 2].map(i => <rect key={i} x="68" y={258 + i * 15} width="64" height="10" rx="1" fill="rgba(245,166,35,0.06)" stroke="rgba(245,166,35,0.25)" strokeWidth=".6" />)}
          <text x="100" y="320" textAnchor="middle" fontSize="7" fill="#F5A623">{batName} · {specs?.batteryKWh || 0} kWh</text>
          {/* DC cable inverter→battery */}
          <path d="M195,210 L195,240 Q195,250 185,250 L140,250 L140,260" fill="none" stroke="#F5A623" strokeWidth="1.5" />
          <path d="M195,210 L195,240 Q195,250 185,250 L140,250 L140,260" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeDasharray="4,16" className="sa-flow-line" />
        </g>
      )}
      {/* Distribution board */}
      <rect x="320" y="170" width="55" height="40" rx="3" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1" />
      <text x="347" y="190" textAnchor="middle" fontSize="7" fontWeight="700" fill="#F5A623">MDB</text>
      <text x="347" y="200" textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.25)">Distribution</text>
      {/* Grid */}
      {hasGrid && (
        <g>
          <circle cx="440" cy="190" r="18" fill="none" stroke="#6366F1" strokeWidth="1.2" />
          <path d="M428,190 Q434,180 440,190 Q446,200 452,190" fill="none" stroke="#6366F1" strokeWidth="1" />
          <text x="440" y="215" textAnchor="middle" fontSize="7" fill="#6366F1">Grid</text>
          {/* Meter */}
          <rect x="475" y="175" width="35" height="30" rx="2" fill="rgba(99,102,241,0.06)" stroke="#6366F1" strokeWidth=".8" />
          <text x="492" y="193" textAnchor="middle" fontSize="6" fontWeight="700" fill="#6366F1">kWh</text>
          {/* Grid→meter */}
          <line x1="458" y1="190" x2="475" y2="190" stroke="#6366F1" strokeWidth="1" />
        </g>
      )}
      {/* Load */}
      {sector === 'industrial' ? (
        <g>
          <rect x="540" y="165" width="55" height="50" rx="2" fill="none" stroke="#27AE60" strokeWidth="1.2" />
          <polygon points="555,165 560,148 565,165" fill="none" stroke="#27AE60" strokeWidth="1" />
          <polygon points="570,165 575,148 580,165" fill="none" stroke="#27AE60" strokeWidth="1" />
          <text x="567" y="225" textAnchor="middle" fontSize="7" fill="#27AE60">Factory</text>
        </g>
      ) : sector === 'commercial' ? (
        <g>
          <rect x="545" y="155" width="45" height="60" rx="2" fill="none" stroke="#27AE60" strokeWidth="1.2" />
          {[0, 1, 2, 3].map(r => [0, 1].map(c => <rect key={`${r}${c}`} x={551 + c * 18} y={162 + r * 13} width="10" height="8" fill="none" stroke="rgba(39,174,96,0.3)" strokeWidth=".5" />))}
          <text x="567" y="225" textAnchor="middle" fontSize="7" fill="#27AE60">Building</text>
        </g>
      ) : (
        <g>
          <polygon points="567,155 545,175 590,175" fill="none" stroke="#27AE60" strokeWidth="1.2" />
          <rect x="550" y="175" width="35" height="30" fill="none" stroke="#27AE60" strokeWidth="1" />
          <rect x="561" y="185" width="10" height="20" fill="none" stroke="#27AE60" strokeWidth=".8" />
          <text x="567" y="215" textAnchor="middle" fontSize="7" fill="#27AE60">Home</text>
        </g>
      )}
      {/* DC cable: panels→inverter */}
      <path d="M210,110 L210,130 Q210,145 210,160" fill="none" stroke="#EF4444" strokeWidth="1.8" />
      <path d="M210,110 L210,160" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.8" strokeDasharray="4,16" className="sa-flow-line" />
      <text x="218" y="140" fontSize="6" fill="rgba(239,68,68,0.5)">DC</text>
      {/* AC cable: inverter→MDB */}
      <line x1="230" y1="185" x2="320" y2="185" stroke="#F5A623" strokeWidth="1.8" />
      <line x1="230" y1="185" x2="320" y2="185" stroke="rgba(255,255,255,.4)" strokeWidth="1.8" strokeDasharray="4,16" className="sa-flow-line" />
      <text x="275" y="180" textAnchor="middle" fontSize="6" fill="rgba(245,166,35,0.5)">AC</text>
      {/* AC cable: MDB→Grid/Load */}
      {hasGrid && <>
        <line x1="375" y1="190" x2="422" y2="190" stroke="#F5A623" strokeWidth="1" />
        <line x1="375" y1="190" x2="422" y2="190" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeDasharray="4,16" className="sa-flow-line" />
      </>}
      <path d={`M375,185 L${hasGrid ? 510 : 420},185 L${hasGrid ? 540 : 540},185`} fill="none" stroke="#27AE60" strokeWidth="1.2" />
      <path d={`M375,185 L${hasGrid ? 540 : 540},185`} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" strokeDasharray="4,16" className="sa-flow-line" />
      {/* Transformer for large industrial */}
      {isLargeIndustrial && (
        <g>
          <circle cx="290" y="275" cy="275" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <circle cx="305" cy="275" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <text x="297" y="295" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">Transformer</text>
        </g>
      )}
      {/* Earth */}
      <line x1="195" y1="210" x2="195" y2="320" stroke="#27AE60" strokeWidth=".8" strokeDasharray="3,3" />
      <g transform="translate(195,322)"><line x1="-6" y1="0" x2="6" y2="0" stroke="#27AE60" strokeWidth="1.2" /><line x1="-3.5" y1="4" x2="3.5" y2="4" stroke="#27AE60" strokeWidth="1" /><line x1="-1.5" y1="8" x2="1.5" y2="8" stroke="#27AE60" strokeWidth=".8" /></g>
      {/* Legend */}
      <g transform="translate(540,265)">
        <rect x="0" y="0" width="145" height="55" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth=".5" />
        <text x="8" y="12" fontSize="6.5" fontWeight="700" fill="rgba(255,255,255,0.35)">ENERGY FLOW</text>
        <line x1="8" y1="22" x2="26" y2="22" stroke="#EF4444" strokeWidth="1.2" /><text x="30" y="25" fontSize="6" fill="rgba(255,255,255,0.3)">DC (panels→inv)</text>
        <line x1="8" y1="33" x2="26" y2="33" stroke="#F5A623" strokeWidth="1.2" /><text x="30" y="36" fontSize="6" fill="rgba(255,255,255,0.3)">AC (inv→grid)</text>
        <line x1="8" y1="44" x2="26" y2="44" stroke="#27AE60" strokeWidth="1.2" /><text x="30" y="47" fontSize="6" fill="rgba(255,255,255,0.3)">Load supply</text>
      </g>
    </svg>
  )
}

// ── Step illustration SVGs (400×280) ──────────────────────────────────────────

function IllRoofSurvey() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Roof */}
      <polygon points="40,170 200,60 360,170" fill="rgba(59,130,246,0.04)" stroke="#3B82F6" strokeWidth="2" />
      <rect x="40" y="170" width="320" height="100" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Sun + shadow rays */}
      <circle cx="320" cy="45" r="20" fill="#F5A623" opacity=".2" /><circle cx="320" cy="45" r="10" fill="#F5A623" opacity=".6" />
      {[0, 1, 2, 3].map(i => <line key={i} x1="320" y1="45" x2={140 + i * 45} y2={130 + i * 8} stroke="#F5A623" strokeWidth=".6" opacity=".3" strokeDasharray="5,4" />)}
      {/* Measurement lines */}
      <line x1="55" y1="165" x2="345" y2="165" stroke="#F5A623" strokeWidth="1" strokeDasharray="6,4" />
      <text x="200" y="160" textAnchor="middle" fontSize="10" fill="#F5A623">← Roof span →</text>
      <line x1="355" y1="75" x2="355" y2="165" stroke="#F5A623" strokeWidth="1" strokeDasharray="6,4" />
      <text x="370" y="120" fontSize="9" fill="#F5A623">↑ Rise</text>
      {/* Compass */}
      <circle cx="55" cy="245" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <text x="55" y="232" textAnchor="middle" fontSize="9" fontWeight="700" fill="#F5A623">N</text>
      <text x="55" y="261" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)">S</text>
      <text x="72" y="249" fontSize="8" fill="rgba(255,255,255,0.2)">E</text>
      <text x="38" y="249" fontSize="8" fill="rgba(255,255,255,0.2)">W</text>
      {/* Callout */}
      <circle cx="250" cy="130" r="14" fill="none" stroke="#F5A623" strokeWidth="1" strokeDasharray="3,3" />
      <text x="250" y="134" textAnchor="middle" fontSize="8" fill="#F5A623">Shade?</text>
    </svg>
  )
}

function IllMountingRail() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Roof surface */}
      <polygon points="20,180 200,60 380,180" fill="rgba(59,130,246,0.03)" stroke="rgba(59,130,246,0.15)" strokeWidth="1" />
      {/* Aluminium rails */}
      <line x1="60" y1="140" x2="340" y2="140" stroke="#F5A623" strokeWidth="4" />
      <line x1="70" y1="115" x2="330" y2="115" stroke="#F5A623" strokeWidth="4" />
      {/* L-feet brackets */}
      {[100, 160, 220, 280].map((x, i) => (
        <g key={i}>
          <rect x={x - 5} y="132" width="10" height="14" rx="1" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <line x1={x} y1="146" x2={x} y2="158" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx={x} cy="160" r="2" fill="rgba(255,255,255,0.15)" />
          <rect x={x - 5} y="107" width="10" height="14" rx="1" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </g>
      ))}
      {/* Waterproof flashing detail */}
      <circle cx="100" cy="160" r="10" fill="none" stroke="#3B82F6" strokeWidth=".8" strokeDasharray="3,2" />
      <line x1="110" y1="155" x2="155" y2="195" stroke="#3B82F6" strokeWidth=".5" />
      <text x="160" y="198" fontSize="8" fill="#3B82F6">EPDM flashing seal</text>
      {/* Tilt angle indicator */}
      <path d="M310,180 L310,130 L340,180 Z" fill="none" stroke="#F5A623" strokeWidth="1" />
      <text x="330" y="165" fontSize="9" fill="#F5A623">25°</text>
      {/* Rail profile cutaway */}
      <rect x="30" y="220" width="80" height="30" rx="2" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth="1" />
      <text x="70" y="238" textAnchor="middle" fontSize="7" fill="#F5A623">Rail profile (40×40mm)</text>
      {/* Torque callout */}
      <circle cx="220" cy="140" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="220" y="144" textAnchor="middle" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.4)">Nm</text>
    </svg>
  )
}

function IllPanelMount({ panelName }) {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Rail base */}
      <line x1="30" y1="180" x2="370" y2="180" stroke="#F5A623" strokeWidth="3" />
      <line x1="35" y1="155" x2="365" y2="155" stroke="#F5A623" strokeWidth="3" />
      {/* Panels */}
      {[0, 1, 2, 3, 4].map(i => {
        const x = 35 + i * 68; return (
          <g key={i}>
            <rect x={x} y="40" width="62" height="110" rx="2" fill="rgba(59,130,246,0.08)" stroke="#3B82F6" strokeWidth="1.5" />
            {[0, 1, 2, 3, 4].map(r => [0, 1].map(c => (
              <rect key={`${r}${c}`} x={x + 4 + c * 29} y={46 + r * 20} width="25" height="16" fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth=".5" />
            )))}
            <line x1={x} y1="150" x2={x + 62} y2="40" stroke="rgba(245,166,35,0.15)" strokeWidth=".5" />
            {/* Clamp */}
            <rect x={x + 27} y="150" width="8" height="8" rx="1" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth=".8" />
          </g>
        )
      })}
      {/* MC4 connectors at bottom of panel 2 */}
      <circle cx="165" cy="160" r="4" fill="#EF4444" opacity=".5" />
      <circle cx="175" cy="160" r="4" fill="rgba(255,255,255,0.15)" />
      <line x1="165" y1="164" x2="165" y2="195" stroke="#EF4444" strokeWidth="1.5" />
      <line x1="175" y1="164" x2="175" y2="195" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <text x="170" y="210" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">MC4 +/−</text>
      {/* Label */}
      <text x="200" y="250" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">{panelName}</text>
      {/* Grounding lug callout */}
      <circle cx="340" cy="155" r="10" fill="none" stroke="#27AE60" strokeWidth="1" strokeDasharray="3,2" />
      <line x1="350" y1="155" x2="375" y2="230" stroke="#27AE60" strokeWidth=".5" />
      <text x="370" y="245" fontSize="7" fill="#27AE60">Ground lug</text>
    </svg>
  )
}

function IllGrounding() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Panel frames with ground cable */}
      {[0, 1, 2].map(i => {
        const x = 60 + i * 100; return (
          <g key={i}>
            <rect x={x} y="30" width="70" height="50" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1" />
            <text x={x + 35} y="60" textAnchor="middle" fontSize="7" fill="rgba(59,130,246,0.4)">Panel {i + 1}</text>
            <circle cx={x + 60} cy="78" r="3" fill="#27AE60" opacity=".5" />
          </g>
        )
      })}
      {/* Ground bus bar */}
      <line x1="120" y1="80" x2="250" y2="80" stroke="#27AE60" strokeWidth="2.5" />
      <text x="185" y="95" textAnchor="middle" fontSize="7" fill="#27AE60">Ground bus bar (6mm² Cu)</text>
      {/* Down conductor */}
      <line x1="185" y1="80" x2="185" y2="200" stroke="#27AE60" strokeWidth="2" strokeDasharray="6,4" />
      {/* Earth rod */}
      <line x1="185" y1="200" x2="185" y2="250" stroke="#27AE60" strokeWidth="3" />
      <polygon points="180,250 185,265 190,250" fill="#27AE60" />
      <text x="205" y="240" fontSize="8" fill="#27AE60">Earth rod</text>
      <text x="205" y="252" fontSize="7" fill="rgba(39,174,96,0.5)">1.8m depth</text>
      {/* Earth symbol */}
      <g transform="translate(185,268)">
        <line x1="-10" y1="0" x2="10" y2="0" stroke="#27AE60" strokeWidth="1.5" />
        <line x1="-6" y1="5" x2="6" y2="5" stroke="#27AE60" strokeWidth="1.2" />
        <line x1="-3" y1="10" x2="3" y2="10" stroke="#27AE60" strokeWidth="1" />
      </g>
      {/* Resistance label */}
      <rect x="240" y="210" width="100" height="30" rx="4" fill="rgba(39,174,96,0.06)" stroke="#27AE60" strokeWidth=".8" />
      <text x="290" y="228" textAnchor="middle" fontSize="8" fill="#27AE60">R ≤ 10 Ω</text>
    </svg>
  )
}

function IllMC4Crimp() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Cable stripped end */}
      <rect x="30" y="120" width="120" height="10" rx="2" fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="1" />
      <rect x="150" y="118" width="40" height="14" rx="1" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <text x="170" y="128" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.4)">Bare Cu</text>
      {/* MC4 connector body */}
      <rect x="200" y="112" width="80" height="26" rx="4" fill="rgba(239,68,68,0.08)" stroke="#EF4444" strokeWidth="1.2" />
      <rect x="240" y="116" width="30" height="18" rx="2" fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth=".8" />
      <text x="255" y="128" textAnchor="middle" fontSize="7" fontWeight="700" fill="#EF4444">MC4+</text>
      {/* Crimp zone */}
      <rect x="200" y="115" width="35" height="20" rx="2" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeDasharray="4,3" />
      <text x="217" y="108" textAnchor="middle" fontSize="7" fill="#F5A623">Crimp here</text>
      {/* Female connector */}
      <rect x="300" y="112" width="80" height="26" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
      <text x="340" y="128" textAnchor="middle" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.4)">MC4−</text>
      {/* Crimper tool illustration */}
      <g transform="translate(100,180)">
        <line x1="0" y1="60" x2="50" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <line x1="100" y1="60" x2="50" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <rect x="35" y="5" width="30" height="15" rx="2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <text x="50" y="15" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">Die</text>
      </g>
      <text x="150" y="260" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">MC4 Crimping Tool</text>
      {/* Pull test callout */}
      <circle cx="330" cy="180" r="16" fill="none" stroke="#27AE60" strokeWidth="1" />
      <text x="330" y="178" textAnchor="middle" fontSize="6" fontWeight="700" fill="#27AE60">Pull</text>
      <text x="330" y="187" textAnchor="middle" fontSize="6" fill="#27AE60">test</text>
      <text x="330" y="205" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">Min 50 N</text>
    </svg>
  )
}

function IllStringWiring() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* String of panels */}
      {[0, 1, 2, 3].map(i => {
        const x = 30 + i * 90; return (
          <g key={i}>
            <rect x={x} y="30" width="75" height="55" rx="2" fill="rgba(59,130,246,0.06)" stroke="#3B82F6" strokeWidth="1" />
            <line x1={x} y1="85" x2={x + 75} y2="30" stroke="rgba(59,130,246,0.1)" strokeWidth=".4" />
            <text x={x + 37} y="60" textAnchor="middle" fontSize="8" fill="rgba(59,130,246,0.4)">P{i + 1}</text>
            {/* MC4 connectors */}
            {i < 3 && <>
              <circle cx={x + 70} cy="92" r="3" fill="#EF4444" opacity=".4" />
              <line x1={x + 70} y1="95" x2={x + 90 + 20} y2="95" stroke="#EF4444" strokeWidth="1.5" />
              <line x1={x + 70} y1="95" x2={x + 90 + 20} y2="95" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeDasharray="3,12" className="sa-flow-line" />
            </>}
          </g>
        )
      })}
      {/* String labels */}
      <text x="200" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF4444">String 1 — Series connection</text>
      {/* Voltage build */}
      <g transform="translate(30,130)">
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <rect x={i * 90} y="0" width="75" height="25" rx="3" fill={`rgba(239,68,68,${0.04 + i * 0.03})`} stroke="rgba(239,68,68,0.2)" strokeWidth=".6" />
            <text x={i * 90 + 37} y="16" textAnchor="middle" fontSize="7" fill="rgba(239,68,68,0.5)">{(i + 1) * 49.5}V</text>
          </g>
        ))}
        <text x="0" y="40" fontSize="7" fill="rgba(255,255,255,0.3)">Voc builds in series: 49.5V → 198V total</text>
      </g>
      {/* String + and − ends */}
      <circle cx="30" cy="100" r="6" fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth="1" />
      <text x="30" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF4444">+</text>
      <circle cx="375" cy="100" r="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="375" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.3)">−</text>
      {/* Multimeter callout */}
      <rect x="250" y="200" width="120" height="55" rx="4" fill="rgba(39,174,96,0.04)" stroke="#27AE60" strokeWidth=".8" />
      <text x="310" y="218" textAnchor="middle" fontSize="8" fontWeight="700" fill="#27AE60">Verify Voc</text>
      <text x="310" y="232" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">Measure open-circuit</text>
      <text x="310" y="244" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">voltage at string ends</text>
    </svg>
  )
}

function IllCombinerBox() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Combiner box */}
      <rect x="110" y="30" width="180" height="200" rx="4" fill="rgba(239,68,68,0.04)" stroke="#EF4444" strokeWidth="1.5" />
      <text x="200" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF4444">String Combiner Box</text>
      {/* Fuses */}
      {[0, 1, 2, 3].map(i => {
        const y = 55 + i * 42; return (
          <g key={i}>
            <text x="125" y={y + 5} fontSize="7" fill="rgba(255,255,255,0.3)">S{i + 1}+</text>
            <line x1="70" y1={y} x2="145" y2={y} stroke="#EF4444" strokeWidth="1.2" />
            <rect x="145" y={y - 6} width="30" height="12" rx="2" fill="none" stroke="#EF4444" strokeWidth="1" />
            <text x="160" y={y + 3} textAnchor="middle" fontSize="6" fill="#EF4444">15A</text>
            <line x1="175" y1={y} x2="240" y2={y} stroke="#EF4444" strokeWidth="1" />
            <line x1="70" y1={y + 10} x2="240" y2={y + 10} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="125" y={y + 15} fontSize="7" fill="rgba(255,255,255,0.2)">S{i + 1}−</text>
          </g>
        )
      })}
      {/* Output bus */}
      <line x1="240" y1="55" x2="240" y2="220" stroke="#EF4444" strokeWidth="2.5" />
      <line x1="240" y1="220" x2="340" y2="220" stroke="#EF4444" strokeWidth="2" />
      <text x="310" y="215" textAnchor="middle" fontSize="7" fill="#EF4444">DC out →</text>
      {/* Surge arrester */}
      <rect x="260" y="100" width="35" height="20" rx="2" fill="rgba(245,166,35,0.06)" stroke="#F5A623" strokeWidth=".8" />
      <text x="277" y="113" textAnchor="middle" fontSize="6" fill="#F5A623">SPD</text>
      <text x="277" y="130" textAnchor="middle" fontSize="6" fill="rgba(245,166,35,0.4)">Surge</text>
    </svg>
  )
}

function IllDCRun() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Conduit */}
      <rect x="30" y="100" width="340" height="20" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {/* DC+ cable */}
      <path d="M30,107 Q120,95 200,107 Q280,119 370,107" fill="none" stroke="#EF4444" strokeWidth="2.5" />
      <path d="M30,107 Q120,95 200,107 Q280,119 370,107" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" strokeDasharray="5,15" className="sa-flow-line" />
      {/* DC- cable */}
      <path d="M30,113 Q120,125 200,113 Q280,101 370,113" fill="none" stroke="rgba(100,100,100,0.6)" strokeWidth="2.5" />
      {/* Labels */}
      <text x="200" y="85" textAnchor="middle" fontSize="9" fill="#EF4444">DC+ (6mm² solar cable)</text>
      <text x="200" y="145" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)">DC− (6mm²)</text>
      {/* Source: combiner */}
      <rect x="10" y="85" width="30" height="50" rx="3" fill="rgba(239,68,68,0.06)" stroke="#EF4444" strokeWidth="1" />
      <text x="25" y="113" textAnchor="middle" fontSize="7" fill="#EF4444">CB</text>
      {/* Destination: inverter */}
      <rect x="360" y="85" width="30" height="50" rx="3" fill="rgba(139,92,246,0.06)" stroke="#8B5CF6" strokeWidth="1" />
      <text x="375" y="113" textAnchor="middle" fontSize="7" fill="#8B5CF6">INV</text>
      {/* Cable clips */}
      {[80, 150, 220, 290].map((x, i) => <rect key={i} x={x - 2} y="97" width="4" height="26" rx="1" fill="rgba(255,255,255,0.08)" />)}
      {/* Cable label tags */}
      {[120, 260].map((x, i) => (
        <g key={i}><rect x={x - 15} y="155" width="30" height="14" rx="2" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.2)" strokeWidth=".6" /><text x={x} y="165" textAnchor="middle" fontSize="6" fill="#EF4444">PV-DC{i + 1}</text></g>
      ))}
      <text x="200" y="200" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)">UV-resistant conduit · labelled every 3m</text>
    </svg>
  )
}

function IllDCIsolator() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Isolator box */}
      <rect x="120" y="50" width="160" height="120" rx="5" fill="rgba(239,68,68,0.04)" stroke="#EF4444" strokeWidth="1.5" />
      <text x="200" y="42" textAnchor="middle" fontSize="10" fontWeight="700" fill="#EF4444">DC Isolator</text>
      {/* Switch symbol */}
      <circle cx="160" cy="110" r="6" fill="none" stroke="#EF4444" strokeWidth="1.5" />
      <line x1="166" y1="110" x2="220" y2="85" stroke="#EF4444" strokeWidth="2.5" />
      <circle cx="230" cy="110" r="6" fill="none" stroke="#EF4444" strokeWidth="1.5" />
      {/* ON/OFF labels */}
      <text x="190" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#27AE60">OFF ✓</text>
      <text x="190" y="145" textAnchor="middle" fontSize="8" fill="rgba(239,68,68,0.4)">ON</text>
      {/* Cables in */}
      <line x1="60" y1="110" x2="154" y2="110" stroke="#EF4444" strokeWidth="2" />
      <text x="90" y="105" textAnchor="middle" fontSize="7" fill="rgba(239,68,68,0.4)">From CB</text>
      {/* Cables out */}
      <line x1="236" y1="110" x2="340" y2="110" stroke="#EF4444" strokeWidth="2" />
      <text x="310" y="105" textAnchor="middle" fontSize="7" fill="rgba(239,68,68,0.4)">To INV</text>
      {/* Rating label */}
      <rect x="140" y="200" width="120" height="30" rx="4" fill="rgba(239,68,68,0.04)" stroke="rgba(239,68,68,0.2)" strokeWidth=".8" />
      <text x="200" y="218" textAnchor="middle" fontSize="8" fill="#EF4444">Rating: 600V DC / 32A</text>
    </svg>
  )
}

function IllBatteryWiring({ batName }) {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Battery unit */}
      <rect x="30" y="50" width="140" height="120" rx="4" fill="rgba(245,166,35,0.04)" stroke="#F5A623" strokeWidth="1.5" />
      {[0, 1, 2, 3].map(i => <rect key={i} x="40" y={60 + i * 25} width="120" height="18" rx="2" fill="rgba(245,166,35,0.06)" stroke="rgba(245,166,35,0.2)" strokeWidth=".6" />)}
      <text x="100" y="185" textAnchor="middle" fontSize="8" fill="#F5A623">{batName}</text>
      {/* Terminal posts */}
      <rect x="55" y="42" width="12" height="12" rx="2" fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth="1" />
      <text x="61" y="40" textAnchor="middle" fontSize="8" fontWeight="700" fill="#EF4444">+</text>
      <rect x="113" y="42" width="12" height="12" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="119" y="40" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgba(255,255,255,0.3)">−</text>
      {/* DC breaker */}
      <rect x="200" y="80" width="50" height="35" rx="3" fill="none" stroke="#EF4444" strokeWidth="1.2" />
      <line x1="215" y1="90" x2="235" y2="105" stroke="#EF4444" strokeWidth="1.5" />
      <text x="225" y="130" textAnchor="middle" fontSize="7" fill="#EF4444">DC Breaker</text>
      {/* Fuse */}
      <rect x="270" y="88" width="30" height="15" rx="3" fill="none" stroke="#F5A623" strokeWidth="1" />
      <text x="285" y="100" textAnchor="middle" fontSize="7" fill="#F5A623">Fuse</text>
      {/* Inverter */}
      <rect x="320" y="60" width="60" height="80" rx="4" fill="rgba(139,92,246,0.06)" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="350" y="95" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8B5CF6">INV</text>
      <text x="350" y="110" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">BAT port</text>
      {/* Cables */}
      <line x1="67" y1="54" x2="67" y2="40" stroke="#EF4444" strokeWidth="2" />
      <path d="M67,40 Q67,25 100,25 L200,90" fill="none" stroke="#EF4444" strokeWidth="2" />
      <line x1="250" y1="97" x2="270" y2="97" stroke="#EF4444" strokeWidth="1.5" />
      <line x1="300" y1="97" x2="320" y2="97" stroke="#EF4444" strokeWidth="1.5" />
      {/* BMS cable */}
      <line x1="100" y1="170" x2="350" y2="170" stroke="#F5A623" strokeWidth="1" strokeDasharray="5,4" />
      <text x="225" y="165" textAnchor="middle" fontSize="7" fill="rgba(245,166,35,0.4)">BMS comm (RS485/CAN)</text>
    </svg>
  )
}

function IllACConnection({ invName }) {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Inverter */}
      <rect x="30" y="70" width="100" height="80" rx="4" fill="rgba(139,92,246,0.06)" stroke="#8B5CF6" strokeWidth="1.2" />
      <text x="80" y="105" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8B5CF6">INV</text>
      <text x="80" y="120" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">{invName}</text>
      <text x="80" y="135" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.2)">AC output</text>
      {/* AC isolator */}
      <circle cx="170" cy="110" r="5" fill="none" stroke="#F5A623" strokeWidth="1.2" />
      <line x1="175" y1="110" x2="200" y2="95" stroke="#F5A623" strokeWidth="2" />
      <circle cx="205" cy="110" r="5" fill="none" stroke="#F5A623" strokeWidth="1.2" />
      <text x="187" y="85" textAnchor="middle" fontSize="7" fill="#F5A623">AC Iso</text>
      {/* Distribution board */}
      <rect x="240" y="50" width="130" height="150" rx="4" fill="rgba(245,166,35,0.03)" stroke="#F5A623" strokeWidth="1.5" />
      <text x="305" y="42" textAnchor="middle" fontSize="9" fontWeight="700" fill="#F5A623">Distribution Board</text>
      {/* Breakers */}
      {[0, 1, 2, 3, 4].map(i => {
        const y = 65 + i * 26; const isSolar = i === 0; return (
          <g key={i}>
            <rect x="255" y={y} width="100" height="18" rx="2" fill={isSolar ? 'rgba(245,166,35,0.08)' : 'rgba(255,255,255,0.02)'} stroke={isSolar ? '#F5A623' : 'rgba(255,255,255,0.08)'} strokeWidth=".8" />
            <line x1="280" y1={y + 4} x2="295" y2={y + 14} stroke={isSolar ? '#F5A623' : 'rgba(255,255,255,0.12)'} strokeWidth="1" />
            <text x="330" y={y + 12} fontSize="6" fill={isSolar ? '#F5A623' : 'rgba(255,255,255,0.2)'}>{isSolar ? 'Solar 32A' : 'Circuit ' + (i + 1)}</text>
          </g>
        )
      })}
      {/* AC cable */}
      <line x1="130" y1="110" x2="165" y2="110" stroke="#F5A623" strokeWidth="2" />
      <line x1="210" y1="110" x2="255" y2="74" stroke="#F5A623" strokeWidth="2" />
      <line x1="130" y1="110" x2="255" y2="74" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeDasharray="5,15" className="sa-flow-line" />
      {/* L, N, E labels */}
      <text x="180" y="135" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.25)">L · N · PE (4mm²)</text>
    </svg>
  )
}

function IllGridMeter() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Bidirectional meter */}
      <rect x="50" y="50" width="120" height="100" rx="5" fill="rgba(99,102,241,0.05)" stroke="#6366F1" strokeWidth="1.5" />
      <circle cx="110" cy="90" r="22" fill="none" stroke="#6366F1" strokeWidth="1.2" />
      <text x="110" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6366F1">kWh</text>
      <polygon points="95,72 100,67 100,77" fill="#6366F1" /><polygon points="125,72 120,67 120,77" fill="#6366F1" />
      <text x="110" y="130" textAnchor="middle" fontSize="7" fill="rgba(99,102,241,0.5)">Bi-directional</text>
      <text x="110" y="42" textAnchor="middle" fontSize="9" fontWeight="700" fill="#6366F1">Export Meter</text>
      {/* Grid symbol */}
      <circle cx="300" cy="90" r="28" fill="none" stroke="#6366F1" strokeWidth="1.5" />
      <path d="M280,90 Q290,75 300,90 Q310,105 320,90" fill="none" stroke="#6366F1" strokeWidth="1.5" />
      <text x="300" y="130" textAnchor="middle" fontSize="9" fill="#6366F1">Utility Grid</text>
      {/* Connection */}
      <line x1="170" y1="90" x2="272" y2="90" stroke="#6366F1" strokeWidth="2" />
      <line x1="170" y1="90" x2="272" y2="90" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeDasharray="5,15" className="sa-flow-line" />
      {/* DNO approval */}
      <rect x="220" y="180" width="160" height="60" rx="5" fill="rgba(39,174,96,0.04)" stroke="#27AE60" strokeWidth="1" />
      <text x="300" y="200" textAnchor="middle" fontSize="9" fontWeight="700" fill="#27AE60">DNO Approval Required</text>
      <text x="300" y="215" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">Submit interconnection application</text>
      <text x="300" y="228" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">before energizing the system</text>
    </svg>
  )
}

function IllPowerOn() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Sequence steps */}
      {['1. AC Main ON', '2. AC Isolator ON', '3. DC Isolator ON', '4. Verify Voc', '5. INV Power ON'].map((s, i) => {
        const y = 30 + i * 45; const done = i < 3;
        return (
          <g key={i}>
            <rect x="40" y={y} width="320" height="35" rx="4" fill={done ? 'rgba(39,174,96,0.04)' : 'rgba(255,255,255,0.02)'} stroke={done ? '#27AE60' : 'rgba(255,255,255,0.08)'} strokeWidth=".8" />
            <circle cx="65" cy={y + 17} r="10" fill={done ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.04)'} stroke={done ? '#27AE60' : 'rgba(255,255,255,0.1)'} strokeWidth="1" />
            {done ? <polyline points={`59,${y + 17} 63,${y + 21} 71,${y + 13}`} fill="none" stroke="#27AE60" strokeWidth="1.5" /> :
              <text x="65" y={y + 21} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.2)">{i + 1}</text>}
            <text x="90" y={y + 21} fontSize="10" fontWeight="600" fill={done ? '#27AE60' : 'rgba(255,255,255,0.5)'}>{s}</text>
          </g>
        )
      })}
      <text x="200" y="270" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)">Power-on sequence — follow order strictly</text>
    </svg>
  )
}

function IllMonitoring() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      {/* Dashboard screen */}
      <rect x="60" y="25" width="280" height="160" rx="6" fill="rgba(39,174,96,0.03)" stroke="#27AE60" strokeWidth="1.5" />
      {/* Title bar */}
      <rect x="60" y="25" width="280" height="22" rx="6" fill="rgba(39,174,96,0.06)" />
      <circle cx="78" cy="36" r="4" fill="#EF4444" opacity=".4" /><circle cx="90" cy="36" r="4" fill="#F5A623" opacity=".4" /><circle cx="102" cy="36" r="4" fill="#27AE60" opacity=".5" />
      <text x="200" y="40" textAnchor="middle" fontSize="7" fill="rgba(39,174,96,0.5)">Solar Monitoring Dashboard</text>
      {/* Generation graph */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
        const h = [15, 22, 35, 50, 55, 48, 38, 20, 8][i]; return (
          <rect key={i} x={80 + i * 28} y={145 - h} width="20" height={h} rx="2" fill={`rgba(39,174,96,${0.15 + i * 0.03})`} stroke="#27AE60" strokeWidth=".5" />
        )
      })}
      <text x="200" y="165" textAnchor="middle" fontSize="6" fill="rgba(39,174,96,0.4)">Today: 32.5 kWh generated</text>
      {/* Stats cards */}
      {[{ l: 'Power', v: '4.2 kW' }, { l: 'Yield', v: '32.5 kWh' }, { l: 'Grid', v: '+8.1 kWh' }].map((s, i) => (
        <g key={i}>
          <rect x={80 + i * 90} y="55" width="75" height="30" rx="3" fill="rgba(39,174,96,0.04)" stroke="rgba(39,174,96,0.15)" strokeWidth=".5" />
          <text x={117 + i * 90} y="68" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)">{s.l}</text>
          <text x={117 + i * 90} y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#27AE60">{s.v}</text>
        </g>
      ))}
      {/* Laptop base */}
      <rect x="40" y="185" width="320" height="8" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth=".5" />
      {/* Wi-Fi icon */}
      {[8, 13, 18].map((r, i) => <path key={i} d={`M200,230 A${r},${r} 0 0 1 ${200 + r},${230 + r}`} fill="none" stroke="#27AE60" strokeWidth="1" opacity={.3 + i * .25} transform="rotate(-45,200,230)" />)}
      <circle cx="200" cy="230" r="2" fill="#27AE60" />
      <text x="200" y="260" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)">Configure alerts · Set export limits</text>
    </svg>
  )
}

function IllTransformer() {
  return (
    <svg viewBox="0 0 400 280" width="100%" style={{ display: 'block' }}>
      <rect width="400" height="280" fill="#0B1F3A" rx="6" />
      <text x="200" y="25" textAnchor="middle" fontSize="10" fontWeight="700" fill="#F5A623">Step-up Transformer (LV→MV)</text>
      {/* Transformer */}
      <circle cx="170" cy="140" r="40" fill="none" stroke="#F5A623" strokeWidth="1.5" />
      <circle cx="230" cy="140" r="40" fill="none" stroke="#F5A623" strokeWidth="1.5" />
      <text x="170" y="137" textAnchor="middle" fontSize="9" fill="#F5A623">LV</text>
      <text x="170" y="150" textAnchor="middle" fontSize="7" fill="rgba(245,166,35,0.4)">400V</text>
      <text x="230" y="137" textAnchor="middle" fontSize="9" fill="#F5A623">MV</text>
      <text x="230" y="150" textAnchor="middle" fontSize="7" fill="rgba(245,166,35,0.4)">11kV</text>
      {/* Cables */}
      <line x1="50" y1="140" x2="130" y2="140" stroke="#F5A623" strokeWidth="2" />
      <text x="80" y="135" textAnchor="middle" fontSize="7" fill="rgba(245,166,35,0.4)">From INV</text>
      <line x1="270" y1="140" x2="360" y2="140" stroke="#6366F1" strokeWidth="2" />
      <text x="320" y="135" textAnchor="middle" fontSize="7" fill="rgba(99,102,241,0.5)">To Grid</text>
      {/* Rating */}
      <rect x="140" y="210" width="120" height="35" rx="4" fill="rgba(245,166,35,0.04)" stroke="rgba(245,166,35,0.2)" strokeWidth=".8" />
      <text x="200" y="230" textAnchor="middle" fontSize="8" fill="#F5A623">500 kVA · Oil-cooled</text>
    </svg>
  )
}

// ── Step builder ──────────────────────────────────────────────────────────────

function buildSteps({ specs, hasBattery, hasGrid, isLargeIndustrial, products }) {
  const pn = products?.panels?.name || `${specs?.panels || 6}× 400W`
  const inv = products?.inverter?.name || 'Inverter'
  const bat = products?.battery?.name || `${specs?.batteryKWh || 0} kWh LFP`

  const base = [
    { id: 'survey', stage: 'mechanical', title: 'Roof / site survey', desc: 'Measure roof dimensions, pitch, and orientation. Perform shading analysis at 9am, 12pm, and 3pm. Record GPS coordinates for irradiance lookup.', tools: ['Level', 'Wrench'], time: '2–3 hrs', torque: null, warning: null, tip: 'Take photos of the roof from each cardinal direction — invaluable for remote design review.', Ill: IllRoofSurvey },
    { id: 'rails', stage: 'mechanical', title: 'Mounting rail installation', desc: `Install aluminium racking rails at calculated tilt angle. Secure L-feet brackets to rafters with lag bolts. Seal every penetration with EPDM flashing.`, tools: ['Drill', 'Wrench', 'Level', 'Torque wrench'], time: '3–5 hrs', torque: 'Lag bolts: 40 Nm · Rail splice: 20 Nm', warning: 'Work at height — fall protection harness and hard hat required at all times.', tip: 'Pre-drill pilot holes to prevent rafter splitting. Use a chalk line for perfect rail alignment.', Ill: IllMountingRail },
    { id: 'panels', stage: 'mechanical', title: 'Panel mounting & clamps', desc: `Mount ${pn} panels onto rails. Secure with mid-clamps (between panels) and end-clamps (at string ends). Attach grounding lugs.`, tools: ['Wrench', 'Torque wrench', 'PPE'], time: '4–8 hrs', torque: 'Mid-clamp: 12 Nm · End-clamp: 14 Nm · Ground lug: 6 Nm', warning: 'Panels are heavy (20 kg) and act as sails in wind. Always work in pairs. Never stand on panels.', tip: 'Stagger panel placement to maintain roof access for future maintenance.', Ill: () => <IllPanelMount panelName={pn} /> },
    { id: 'ground', stage: 'mechanical', title: 'Equipment grounding', desc: 'Bond all panel frames, rails, and inverter chassis to the main earth bus bar using 6mm² green/yellow copper. Drive earth rod to 1.8m minimum depth.', tools: ['Wrench', 'Multimeter'], time: '1–2 hrs', torque: 'Ground lug: 6 Nm', warning: null, tip: 'Test earth resistance with a ground tester — must be ≤ 10Ω. If soil is dry/rocky, use multiple rods.', Ill: IllGrounding },
  ]

  const dc = [
    { id: 'mc4', stage: 'dc', title: 'MC4 connector crimping', desc: 'Strip 8mm of insulation from each cable end. Insert into MC4 contact pin and crimp with calibrated tool. Snap housing closed until it clicks.', tools: ['Crimper', 'Cable cutter', 'Multimeter'], time: '1–2 hrs', torque: null, warning: 'Use only manufacturer-matched MC4 pairs. Mismatched connectors cause arcing and fire risk.', tip: 'Always perform a 50N pull test on every crimped connector. A failed crimp is a future fire.', Ill: IllMC4Crimp },
    { id: 'strings', stage: 'dc', title: 'String wiring (series)', desc: `Connect panels in series within each string. Verify Voc builds correctly (≈49.5V per panel). Label each string at both ends.`, tools: ['Multimeter', 'PPE'], time: '2–4 hrs', torque: null, warning: 'Panels produce voltage when exposed to light. Cover panels or work at dawn/dusk. Never disconnect MC4 under load.', tip: 'Measure Isc of each string — strings should be within 5% of each other. Mismatch indicates a wiring error.', Ill: IllStringWiring },
    { id: 'combiner', stage: 'dc', title: 'Combiner box wiring', desc: 'Route each string pair (+ and −) into the combiner box through cable glands. Connect through string fuses (15A). Install surge protection device (SPD).', tools: ['Screwdriver', 'Crimper', 'Multimeter'], time: '1–2 hrs', torque: null, warning: 'Tighten cable glands to IP65 rating. Loose glands allow water ingress and corrosion.', tip: 'Label each fuse with its string number. Document fuse ratings in the commissioning log.', Ill: IllCombinerBox },
    { id: 'dc_run', stage: 'dc', title: 'DC cable run to inverter', desc: `Route DC cables in UV-resistant conduit from combiner box to inverter location. Use 6mm² solar-rated cable. Secure with clips every 300mm.`, tools: ['Cable cutter', 'Drill', 'Screwdriver'], time: '2–3 hrs', torque: null, warning: 'DC arcs cannot be extinguished like AC — they are self-sustaining. Ensure all joints are mechanically secure.', tip: 'Leave 500mm service loop at each end for future re-termination.', Ill: IllDCRun },
    { id: 'dc_iso', stage: 'dc', title: 'DC isolator connection', desc: `Wire the DC isolator switch between combiner output and inverter DC input. Verify isolator is rated for system Voc and Isc.`, tools: ['Screwdriver', 'Multimeter', 'Torque wrench'], time: '30–60 min', torque: 'Terminal screws: 2.5 Nm', warning: 'Verify DC isolator is in OFF position before connecting any cables. Test isolation with multimeter.', tip: 'Install the isolator within arm\'s reach of the inverter for emergency shutdown access.', Ill: IllDCIsolator },
  ]

  const battery = [
    { id: 'bat_wire', stage: 'dc', title: 'Battery wiring & BMS', desc: `Install ${bat}. Connect DC cables via fuse and breaker to inverter battery port. Connect BMS communication cable (RS485/CAN). Verify polarity.`, tools: ['Multimeter', 'Torque wrench', 'Crimper', 'Screwdriver'], time: '2–3 hrs', torque: 'Battery terminal: 8 Nm', warning: 'Battery short circuits deliver thousands of amps instantly. Always install a DC breaker AND fuse. Never work on a live battery.', tip: 'Set initial charge parameters per manufacturer datasheet — wrong settings void warranty and risk thermal runaway.', Ill: () => <IllBatteryWiring batName={bat} /> },
  ]

  const ac = [
    { id: 'ac_conn', stage: 'ac', title: 'Inverter AC output connection', desc: `Connect ${inv} AC output (L, N, PE) through an AC isolator to a dedicated solar circuit breaker in the main distribution board.`, tools: ['Screwdriver', 'Multimeter', 'Cable cutter'], time: '1–2 hrs', torque: 'AC terminals: 2.5 Nm', warning: 'All AC work must be performed by a licensed electrician. Disconnect mains supply before making any connections.', tip: 'Use a correctly rated Type B RCD for PV systems — Type A will not detect DC fault currents from the inverter.', Ill: () => <IllACConnection invName={inv} /> },
  ]

  const grid = [
    { id: 'grid_meter', stage: 'ac', title: 'Grid connection & metering', desc: 'Install bidirectional export meter. Submit interconnection application to distribution network operator (DNO). Wait for formal approval before energizing.', tools: ['Screwdriver', 'Multimeter'], time: '1–3 hrs + approval', torque: null, warning: 'Do NOT energize the system until the utility has issued written grid connection approval. Anti-islanding must be tested.', tip: 'Take meter readings before and after commissioning — the delta proves the system is generating and exporting.', Ill: IllGridMeter },
  ]

  const commission = [
    { id: 'power_on', stage: 'ac', title: 'System power-on sequence', desc: 'Follow strict sequence: 1) AC main ON, 2) AC isolator ON, 3) DC isolator ON, 4) Verify Voc, 5) Inverter power ON. Record all readings.', tools: ['Multimeter'], time: '30–60 min', torque: null, warning: 'Never turn on DC before AC on a grid-tied inverter — it needs grid reference frequency to synchronize.', tip: 'Take a video of the first power-on showing the inverter display — excellent proof of commissioning for warranty.', Ill: IllPowerOn },
    { id: 'monitor', stage: 'ac', title: 'Monitoring setup', desc: 'Connect the inverter to Wi-Fi. Set up the manufacturer monitoring app. Configure generation alerts, fault notifications, and export limits.', tools: ['Screwdriver'], time: '30–60 min', torque: null, warning: null, tip: 'Set a daily generation threshold alert — if the system produces less than 80% of expected, it flags a potential issue early.', Ill: IllMonitoring },
  ]

  const transformer = [
    { id: 'transformer', stage: 'ac', title: 'Step-up transformer', desc: 'For systems >200 kWp, install a step-up transformer (LV 400V → MV 11kV). EPC contractor and utility coordination required.', tools: ['Wrench', 'Multimeter'], time: '1–2 days (EPC)', torque: null, warning: 'High-voltage work — only qualified HV engineers may commission the transformer. Exclusion zone required.', tip: 'Request factory test certificates for the transformer before accepting delivery.', Ill: IllTransformer },
  ]

  const steps = [
    ...base,
    ...dc,
    ...(hasBattery ? battery : []),
    ...ac,
    ...(hasGrid ? grid : []),
    ...(isLargeIndustrial ? transformer : []),
    ...commission,
  ]

  return steps
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SystemAssembly({ specs, systemType: stProp, sector: sectorProp, products }) {
  const systemType = (stProp || '').toLowerCase()
  const hasBattery = systemType.includes('grid-tied only') ? false : (specs?.batteryKWh || 0) > 0
  const isOffGrid = systemType.includes('off-grid')
  const hasGrid = !isOffGrid
  const sector = sectorProp || 'residential'
  const kw = specs?.systemKW || 5
  const isLargeIndustrial = sector === 'industrial' && kw > 200

  const steps = buildSteps({ specs, hasBattery, hasGrid, isLargeIndustrial, products })

  const [completed, setCompleted] = useState({})
  const [zoomed, setZoomed] = useState(null)
  const containerRef = useRef(null)

  const toggle = useCallback((id) => setCompleted(prev => ({ ...prev, [id]: !prev[id] })), [])
  const doneCount = Object.values(completed).filter(Boolean).length
  const pct = Math.round((doneCount / steps.length) * 100)

  // PDF export
  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.setFontSize(18)
    doc.setTextColor(11, 31, 58)
    doc.text('Solarah — Assembly Guide', 15, 20)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`${specs?.systemKW || 5} kWp · ${specs?.panels || 6} panels · ${sector}`, 15, 28)
    doc.text(`System type: ${stProp || 'Hybrid'}`, 15, 34)
    let y = 45
    steps.forEach((s, i) => {
      if (y > 265) { doc.addPage(); y = 20 }
      const stage = STAGE[s.stage]
      doc.setFontSize(10)
      doc.setTextColor(...hexToRgb(stage.color))
      doc.text(`${String(i + 1).padStart(2, '0')}  ${stage.label}`, 15, y)
      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text(s.title, 15, y + 6)
      doc.setFontSize(8)
      doc.setTextColor(100)
      const descLines = doc.splitTextToSize(s.desc, 170)
      doc.text(descLines, 15, y + 12)
      y += 14 + descLines.length * 4
      if (s.warning) {
        doc.setTextColor(200, 120, 0)
        const wLines = doc.splitTextToSize(`⚠ ${s.warning}`, 165)
        doc.text(wLines, 18, y)
        y += wLines.length * 4 + 2
      }
      if (s.tip) {
        doc.setTextColor(39, 174, 96)
        const tLines = doc.splitTextToSize(`💡 ${s.tip}`, 165)
        doc.text(tLines, 18, y)
        y += tLines.length * 4 + 2
      }
      y += 6
    })
    doc.save('solarah-assembly-guide.pdf')
  }, [steps, specs, sector, stProp])

  return (
    <div ref={containerRef} style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '1.5rem' }}>
      <style>{ANIM_CSS}</style>

      {/* Fullscreen modal */}
      {zoomed !== null && (
        <div className="sa-modal-bg" onClick={() => setZoomed(null)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '100%' }}>
            {(() => { const Ill = steps[zoomed]?.Ill; return Ill ? <Ill /> : null })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Physical assembly guide</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>System assembly — {steps.length} steps</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {specs?.systemKW || 5} kWp · {hasBattery ? (hasGrid ? 'Hybrid' : 'Off-grid') : 'Grid-tied'} · {sector}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(STAGE).map(([k, v]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, display: 'inline-block' }} /> {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{doneCount} of {steps.length} complete</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? '#27AE60' : '#F5A623' }}>{pct}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#27AE60' : 'linear-gradient(90deg, #3B82F6, #EF4444, #F5A623)', borderRadius: 3, transition: 'width .3s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => toggle(s.id)} title={`${i + 1}. ${s.title}`}
              style={{ width: 20, height: 20, borderRadius: 4, border: 'none', cursor: 'pointer', background: completed[s.id] ? STAGE[s.stage].color : STAGE[s.stage].bg, color: completed[s.id] ? '#fff' : STAGE[s.stage].color, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
              {completed[s.id] ? '✓' : i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* System overview */}
      <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}>System overview — component layout</div>
        <SystemOverview specs={specs} sector={sector} hasBattery={hasBattery} hasGrid={hasGrid} isLargeIndustrial={isLargeIndustrial} products={products} />
      </div>

      {/* Step cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {steps.map((s, i) => {
          const stage = STAGE[s.stage]
          const isDone = completed[s.id]
          const Ill = s.Ill
          return (
            <div key={s.id} style={{ background: isDone ? 'rgba(39,174,96,0.03)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${isDone ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, borderLeft: `4px solid ${stage.color}`, overflow: 'hidden', transition: 'all .2s' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: stage.bg, border: `1px solid ${stage.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: stage.color }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 9, color: stage.color, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 700 }}>{stage.label}</span>
                </div>
                <button onClick={() => toggle(s.id)} style={{ width: 26, height: 26, borderRadius: 7, border: `1.5px solid ${isDone ? '#27AE60' : 'rgba(255,255,255,0.12)'}`, background: isDone ? 'rgba(39,174,96,0.12)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#27AE60' : 'rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 700, transition: 'all .2s' }}>
                  {isDone ? '✓' : ''}
                </button>
              </div>
              <div style={{ padding: '6px 16px 0', fontSize: 17, fontWeight: 700, color: '#fff', opacity: isDone ? .45 : 1, textDecoration: isDone ? 'line-through' : 'none' }}>{s.title}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '12px 16px 16px', alignItems: 'start' }}>
                {/* Left: illustration */}
                <div className="sa-expand" onClick={() => setZoomed(i)} style={{ borderRadius: 8, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                  <Ill />
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,.5)', borderRadius: 4, padding: '2px 6px', fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>Click to expand</div>
                </div>

                {/* Right: details */}
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12 }}>{s.desc}</div>

                  {/* Tools */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Tools</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>{s.tools.map(t => <ToolChip key={t} name={t} />)}</div>
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>⏱ Estimated: {s.time}</div>

                  {/* Torque spec */}
                  {s.torque && (
                    <div style={{ fontSize: 11, color: '#3B82F6', background: 'rgba(59,130,246,0.06)', border: '0.5px solid rgba(59,130,246,0.15)', borderRadius: 6, padding: '7px 10px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <svg viewBox="0 0 16 16" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}><line x1="2" y1="13" x2="12" y2="3" stroke="#3B82F6" strokeWidth="1.5" /><circle cx="13" cy="2" r="2" fill="none" stroke="#3B82F6" strokeWidth=".8" /></svg>
                      <span>{s.torque}</span>
                    </div>
                  )}

                  {/* Safety warning */}
                  {s.warning && (
                    <div style={{ fontSize: 11, color: '#F5A623', background: 'rgba(245,166,35,0.05)', border: '0.5px solid rgba(245,166,35,0.15)', borderRadius: 6, padding: '7px 10px', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45 }}>
                      <svg viewBox="0 0 16 16" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}><polygon points="8,1 15,15 1,15" fill="none" stroke="#F5A623" strokeWidth="1.2" /><text x="8" y="13" textAnchor="middle" fontSize="9" fontWeight="700" fill="#F5A623">!</text></svg>
                      <span>{s.warning}</span>
                    </div>
                  )}

                  {/* Pro tip */}
                  {s.tip && (
                    <div style={{ fontSize: 11, color: '#27AE60', background: 'rgba(39,174,96,0.05)', border: '0.5px solid rgba(39,174,96,0.15)', borderRadius: 6, padding: '7px 10px', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.45 }}>
                      <svg viewBox="0 0 16 16" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="6" r="5" fill="none" stroke="#27AE60" strokeWidth="1" /><rect x="6" y="11" width="4" height="3" rx=".5" fill="none" stroke="#27AE60" strokeWidth=".8" /></svg>
                      <span>{s.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Print button */}
      <div className="sa-no-print" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button onClick={exportPDF} style={{ flex: 1, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 8, padding: '12px 0', cursor: 'pointer', color: '#F5A623', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg viewBox="0 0 16 16" width="16" height="16"><rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="#F5A623" strokeWidth="1" /><line x1="5" y1="5" x2="11" y2="5" stroke="#F5A623" strokeWidth=".7" /><line x1="5" y1="8" x2="11" y2="8" stroke="#F5A623" strokeWidth=".7" /><line x1="5" y1="11" x2="9" y2="11" stroke="#F5A623" strokeWidth=".7" /></svg>
          Export Assembly Guide (PDF)
        </button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}
