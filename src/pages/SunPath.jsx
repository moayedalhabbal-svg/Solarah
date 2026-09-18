import { useEffect, useRef, useState } from 'react'
import styles from './SunPath.module.css'

// ── Solar position math (Spencer/Michalsky algorithm) ─────────────────────────
function toRad(d) { return d * Math.PI / 180 }
function toDeg(r) { return r * 180 / Math.PI }

function julianDay(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth() + 1, d = date.getUTCDate()
  return 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5
}

function sunPosition(date, lat, lon) {
  const JD = julianDay(date)
  const T = (JD - 2451545.0) / 36525
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  L0 = ((L0 % 360) + 360) % 360
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  M = toRad(((M % 360) + 360) % 360)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M)
  const sunLon = L0 + C
  const omega = 125.04 - 1934.136 * T
  const lambda = toRad(sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega)))
  const obliq = toRad(23.439291 - 0.013004 * T)
  const decl = Math.asin(Math.sin(obliq) * Math.sin(lambda))
  const y2 = Math.tan(obliq / 2) ** 2
  const EqT = toDeg(y2 * Math.sin(2 * toRad(L0))
    - 2 * 0.016708634 * Math.sin(M)
    + 4 * 0.016708634 * y2 * Math.sin(M) * Math.cos(2 * toRad(L0))
    - 0.5 * y2 ** 2 * Math.sin(4 * toRad(L0))
    - 1.25 * 0.016708634 ** 2 * Math.sin(2 * M)) * 4
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const solarNoon = 12 - lon / 15 - EqT / 60
  const hourAngle = toRad((utcH - solarNoon) * 15)
  const latR = toRad(lat)
  const altitude = Math.asin(
    Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle)
  )
  let azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(decl) * Math.cos(latR) - Math.sin(latR) * Math.cos(hourAngle)
  )
  azimuth = (toDeg(azimuth) + 360) % 360
  return { altitude: toDeg(altitude), azimuth, decl: toDeg(decl), solarNoon }
}

function sunriseSet(date, lat, lon) {
  const noonDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0))
  const { decl, solarNoon } = sunPosition(noonDate, lat, lon)
  const cosHA = -Math.tan(toRad(lat)) * Math.tan(toRad(decl))
  if (cosHA < -1) return { rise: 0, set: 24, daylight: 24 }
  if (cosHA > 1) return { rise: 12, set: 12, daylight: 0 }
  const HA = toDeg(Math.acos(cosHA)) / 15
  // Use solarNoon (which includes EqT correction) instead of raw 12 - lon/15
  return { rise: solarNoon - HA, set: solarNoon + HA, daylight: HA * 2 }
}

function fmtTime(h) {
  if (isNaN(h) || h < 0 || h > 28) return '—'
  const hh = Math.floor(((h % 24) + 24) % 24)
  const mm = Math.round((h - Math.floor(h)) * 60)
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SunPath() {
  const canvasRef = useRef(null)
  const [lat, setLat] = useState(30.0444)
  const [lon, setLon] = useState(31.2357)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({ rise: '—', set: '—', peak: '—', hours: '—', currentAlt: '—', currentAz: '—' })
  const [hovTip, setHovTip] = useState(null)
  const pathRef = useRef([])
  const [locating, setLocating] = useState(false)

  const geoLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(parseFloat(pos.coords.latitude.toFixed(4)))
      setLon(parseFloat(pos.coords.longitude.toFixed(4)))
      setLocating(false)
    }, () => setLocating(false))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = 340
    canvas.width = W * DPR
    canvas.height = H * DPR
    ctx.scale(DPR, DPR)

    const cx = W / 2, cy = H * 0.84
    const R = Math.min(W * 0.38, H * 0.72)

    // Project az+alt → canvas coords
    function project(az, alt) {
      if (alt <= 0) return null
      const r = R * (1 - alt / 90)
      const angle = toRad(az - 180)
      return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) }
    }

    // Build path points (every 5 min)
    const baseDate = new Date(date + 'T00:00:00Z')
    const points = []
    for (let m = 0; m <= 1440; m += 5) {
      const d2 = new Date(baseDate.getTime() + m * 60000)
      const pos = sunPosition(d2, lat, lon)
      if (pos.altitude > 0) {
        const pt = project(pos.azimuth, pos.altitude)
        if (pt) points.push({ ...pt, alt: pos.altitude, az: pos.azimuth, hour: m / 60 })
      }
    }
    pathRef.current = points

    // Current sun info for stats (computed once, not per frame)
    const now = new Date()
    const checkTime = new Date(Date.UTC(
      baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(),
      now.getUTCHours(), now.getUTCMinutes(), 0
    ))
    const cur = sunPosition(checkTime, lat, lon)
    const sunPt = project(cur.azimuth, cur.altitude)

    let animId
    const render = (timestamp) => {
      ctx.save()
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, W, H)

      // Sky background
      const sky = ctx.createRadialGradient(cx, cy * 0.4, 0, cx, cy, R * 1.5)
      sky.addColorStop(0, '#0d2a4a')
      sky.addColorStop(1, '#060f1e')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Ground
      const gnd = ctx.createLinearGradient(0, cy, 0, H)
      gnd.addColorStop(0, '#1a3a1a')
      gnd.addColorStop(1, '#0a150a')
      ctx.fillStyle = gnd
      ctx.beginPath()
      ctx.ellipse(cx, cy, R * 1.5, R * 0.22, 0, 0, Math.PI)
      ctx.closePath()
      ctx.fill()

      // Horizon
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath(); ctx.moveTo(cx - R * 1.6, cy); ctx.lineTo(cx + R * 1.6, cy); ctx.stroke()
      ctx.setLineDash([])

      // Altitude rings
      ;[30, 60, 90].forEach(alt => {
        const r = R * (1 - alt / 90)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.22)'
        ctx.font = `10px Inter, sans-serif`
        ctx.fillText(`${alt}\u00b0`, cx + r + 4, cy - 3)
      })

      // Cardinal labels
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText('N', cx, cy - R - 14)
      ctx.fillText('S', cx, cy + 18)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillText('E', cx - R - 18, cy + 5)
      ctx.fillText('W', cx + R + 18, cy + 5)
      ctx.textAlign = 'left'

      // Draw path with glow
      if (points.length > 1) {
        ctx.save()
        ctx.shadowColor = 'rgba(245,166,35,0.45)'
        ctx.shadowBlur = 14
        const pg = ctx.createLinearGradient(points[0].x, 0, points[points.length - 1].x, 0)
        pg.addColorStop(0, 'rgba(255,120,0,0.5)')
        pg.addColorStop(0.5, 'rgba(245,166,35,0.9)')
        pg.addColorStop(1, 'rgba(255,80,0,0.5)')
        ctx.strokeStyle = pg
        ctx.lineWidth = 3.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.stroke()
        ctx.restore()
      }

      // Animated sun corona glow
      if (sunPt && cur.altitude > 0) {
        const t = (timestamp || 0) / 1000
        // Inner glow: 4s cycle, 30→50px
        const pulse1 = (Math.sin(t * Math.PI * 2 / 4) + 1) / 2
        // Outer glow: 4s cycle, 2s out of phase, 45→80px
        const pulse2 = (Math.sin((t + 2) * Math.PI * 2 / 4) + 1) / 2

        const innerR = 30 + 20 * pulse1
        const outerR = 45 + 35 * pulse2

        // Outer glow ring (out of phase)
        const glow2 = ctx.createRadialGradient(sunPt.x, sunPt.y, 0, sunPt.x, sunPt.y, outerR)
        glow2.addColorStop(0, `rgba(245,166,35,${0.15 + 0.1 * pulse2})`)
        glow2.addColorStop(1, 'transparent')
        ctx.fillStyle = glow2
        ctx.beginPath(); ctx.arc(sunPt.x, sunPt.y, outerR, 0, Math.PI * 2); ctx.fill()

        // Inner glow ring
        const glow1 = ctx.createRadialGradient(sunPt.x, sunPt.y, 0, sunPt.x, sunPt.y, innerR)
        glow1.addColorStop(0, `rgba(245,200,50,${0.45 + 0.1 * pulse1})`)
        glow1.addColorStop(1, 'transparent')
        ctx.fillStyle = glow1
        ctx.beginPath(); ctx.arc(sunPt.x, sunPt.y, innerR, 0, Math.PI * 2); ctx.fill()

        // Sun disc
        ctx.fillStyle = '#F5A623'
        ctx.beginPath(); ctx.arc(sunPt.x, sunPt.y, 12, 0, Math.PI * 2); ctx.fill()
        // Specular highlight
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.beginPath(); ctx.arc(sunPt.x - 3, sunPt.y - 3, 4.5, 0, Math.PI * 2); ctx.fill()
      }

      ctx.restore()
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    // Stats
    const ss = sunriseSet(baseDate, lat, lon)
    const noonD = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 12))
    const peakPos = sunPosition(noonD, lat, lon)
    setStats({
      rise: fmtTime(ss.rise + lon / 15),
      set: fmtTime(ss.set + lon / 15),
      peak: `${Math.max(0, peakPos.altitude).toFixed(1)}\u00b0`,
      hours: `${ss.daylight.toFixed(1)}h`,
      currentAlt: cur.altitude > 0 ? `${cur.altitude.toFixed(1)}\u00b0` : 'Below horizon',
      currentAz: `${cur.azimuth.toFixed(0)}\u00b0`,
    })

    return () => cancelAnimationFrame(animId)
  }, [lat, lon, date])

  // Canvas hover tooltip
  const handleMouseMove = e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let closest = null, minD = 18
    pathRef.current.forEach(p => {
      const d = Math.hypot(p.x - mx, p.y - my)
      if (d < minD) { minD = d; closest = p }
    })
    if (closest) {
      setHovTip({ x: closest.x, y: closest.y, alt: closest.alt.toFixed(1), az: closest.az.toFixed(0), h: fmtTime(closest.hour) })
    } else {
      setHovTip(null)
    }
  }

  // Hourly bars
  const baseDate = new Date(date + 'T00:00:00Z')
  const bars = Array.from({ length: 16 }, (_, i) => {
    const h = i + 5
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), h))
    const pos = sunPosition(d, lat, lon)
    return { h, alt: Math.max(0, pos.altitude) }
  })
  const maxAlt = Math.max(...bars.map(b => b.alt), 1)

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHeader}>
        <div>
          <div className="section-label">Sun Path Tracker</div>
          <h1 className={styles.h1}>Solar path for your location</h1>
          <p className={styles.sub}>See exactly how the sun moves across the sky at your coordinates — any date, anywhere in the world.</p>
        </div>
        <button className="btn-primary" onClick={geoLocate} disabled={locating}>
          <i className="ti ti-current-location" aria-hidden="true" />
          {locating ? 'Locating...' : 'Use my location'}
        </button>
      </div>

      <div className={styles.controls}>
        <div className="field">
          <label>Latitude</label>
          <input type="number" value={lat} step="0.0001" min="-90" max="90" onChange={e => setLat(parseFloat(e.target.value))} />
        </div>
        <div className="field">
          <label>Longitude</label>
          <input type="number" value={lon} step="0.0001" min="-180" max="180" onChange={e => setLon(parseFloat(e.target.value))} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovTip(null)}
        />
        {hovTip && (
          <div className={styles.tooltip} style={{ left: hovTip.x + 14, top: hovTip.y - 32 }}>
            <strong>{hovTip.h}</strong> · alt: <span style={{ color: '#F5A623' }}>{hovTip.alt}°</span> · az: {hovTip.az}°
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><div className={styles.statVal}>{stats.rise}</div><div className={styles.statLabel}>Sunrise</div></div>
        <div className={styles.statCard}><div className={styles.statVal}>{stats.set}</div><div className={styles.statLabel}>Sunset</div></div>
        <div className={styles.statCard}><div className={styles.statVal}>{stats.peak}</div><div className={styles.statLabel}>Peak altitude</div></div>
        <div className={styles.statCard}><div className={styles.statVal}>{stats.hours}</div><div className={styles.statLabel}>Daylight hours</div></div>
        <div className={styles.statCard}><div className={styles.statVal} style={{ color: '#27AE60' }}>{stats.currentAlt}</div><div className={styles.statLabel}>Current altitude</div></div>
        <div className={styles.statCard}><div className={styles.statVal} style={{ color: '#27AE60' }}>{stats.currentAz}</div><div className={styles.statLabel}>Current azimuth</div></div>
      </div>

      <div className={styles.barsCard}>
        <div className={styles.barsTitle}>☀ Solar intensity by hour</div>
        <div className={styles.bars}>
          {bars.map(b => (
            <div key={b.h} className={styles.barWrap}>
              <div className={styles.barOuter}>
                <div
                  className={styles.barFill}
                  style={{
                    height: `${b.alt > 0 ? (b.alt / maxAlt) * 100 : 4}%`,
                    background: b.alt > 0 ? 'linear-gradient(to top, #F5A623, #ffd065)' : 'rgba(255,255,255,0.07)'
                  }}
                />
              </div>
              <div className={styles.barLabel}>{b.h === 12 ? 'Noon' : b.h}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
