// ── Solarah Calculation Engine ────────────────────────────────────────────────
// All solar sizing math lives here. Import and call calc(state) anywhere.

export const PEAK_SUN = {
  'North Africa / Middle East': 6.2,
  'South / Southeast Asia':     5.5,
  'Sub-Saharan Africa':         5.8,
  'Southern Europe':            5.0,
  'Northern Europe':            3.2,
  'North America (South)':      5.5,
  'North America (North)':      4.2,
  'Latin America':              5.2,
  'Australia / Pacific':        5.6,
  'East Asia':                  4.5,
}

export const TARIFFS = {
  'North Africa / Middle East': 0.06,
  'South / Southeast Asia':     0.10,
  'Sub-Saharan Africa':         0.14,
  'Southern Europe':            0.22,
  'Northern Europe':            0.28,
  'North America (South)':      0.13,
  'North America (North)':      0.14,
  'Latin America':              0.11,
  'Australia / Pacific':        0.22,
  'East Asia':                  0.13,
}

export const APPLIANCES = [
  { id: 'ac',     name: 'Air conditioning',   watts: 1500, defaultHrs: 8  },
  { id: 'fridge', name: 'Refrigerator',        watts: 150,  defaultHrs: 24 },
  { id: 'wm',     name: 'Washing machine',     watts: 500,  defaultHrs: 1  },
  { id: 'tv',     name: 'TV & entertainment',  watts: 200,  defaultHrs: 5  },
  { id: 'lights', name: 'Lighting',            watts: 200,  defaultHrs: 8  },
  { id: 'water',  name: 'Water heater',        watts: 2000, defaultHrs: 2  },
  { id: 'pc',     name: 'Computer / office',   watts: 300,  defaultHrs: 8  },
  { id: 'pump',   name: 'Water pump',          watts: 750,  defaultHrs: 3  },
]

// ── Commercial business types ─────────────────────────────────────────────────
export const COMMERCIAL_TYPES = [
  { id: 'office_sm',   name: 'Office building (small, <500m²)', dailyKWh: 80,   keyLoads: 'Lighting, HVAC, computers, elevators' },
  { id: 'office_lg',   name: 'Office building (large, >500m²)', dailyKWh: 350,  keyLoads: 'Lighting, HVAC, computers, data room, server cooling' },
  { id: 'retail',      name: 'Retail shop / boutique',          dailyKWh: 45,   keyLoads: 'Lighting, POS systems, HVAC, refrigeration' },
  { id: 'mall',        name: 'Shopping mall',                   dailyKWh: 8000, keyLoads: 'HVAC, lighting, escalators, food court' },
  { id: 'hotel_sm',    name: 'Hotel (small, <50 rooms)',        dailyKWh: 600,  keyLoads: 'HVAC, hot water, laundry, kitchen' },
  { id: 'hotel_lg',    name: 'Hotel (large, >50 rooms)',        dailyKWh: 4500, keyLoads: 'HVAC, hot water, laundry, kitchen, pool, gym, conference rooms' },
  { id: 'restaurant',  name: 'Restaurant / cafe',               dailyKWh: 120,  keyLoads: 'Kitchen equipment, HVAC, lighting, refrigeration' },
  { id: 'hospital',    name: 'Hospital / clinic',               dailyKWh: 2200, keyLoads: 'Medical equipment, 24hr HVAC, sterilization' },
]

// ── Industrial types ──────────────────────────────────────────────────────────
export const INDUSTRIAL_TYPES = [
  { id: 'textile',       name: 'Textile / clothing factory',   dailyKWh: 1200, peakKW: 350,  notes: 'High motor loads, power factor correction needed',       motorHeavy: true },
  { id: 'food',          name: 'Food processing plant',        dailyKWh: 2800, peakKW: 800,  notes: 'Refrigeration compressors, steam boilers',               motorHeavy: false },
  { id: 'automotive',    name: 'Automotive parts',             dailyKWh: 3500, peakKW: 1200, notes: 'Heavy machinery, welding loads',                          motorHeavy: true },
  { id: 'pharma',        name: 'Pharmaceutical',               dailyKWh: 4200, peakKW: 1400, notes: 'Clean rooms, HVAC precision, 24hr operation',             motorHeavy: false },
  { id: 'printing',      name: 'Printing & packaging',         dailyKWh: 900,  peakKW: 280,  notes: 'Press machinery, drying ovens',                           motorHeavy: false },
  { id: 'ceramics',      name: 'Ceramics / glass',             dailyKWh: 5000, peakKW: 2000, notes: 'Kiln loads, very high temperature process',               motorHeavy: true },
  { id: 'plastics',      name: 'Plastics & rubber',            dailyKWh: 1800, peakKW: 600,  notes: 'Injection molding, extruders',                            motorHeavy: false },
  { id: 'electronics',   name: 'Electronics assembly',         dailyKWh: 750,  peakKW: 220,  notes: 'Cleanroom HVAC, precision temperature',                   motorHeavy: false },
  { id: 'wood',          name: 'Wood / furniture',             dailyKWh: 650,  peakKW: 200,  notes: 'Cutting machinery, dust extraction, drying',              motorHeavy: false },
  { id: 'cold_storage',  name: 'Cold storage / logistics',    dailyKWh: 3000, peakKW: 900,  notes: 'Compressors, 24hr refrigeration, loading bays',           motorHeavy: false },
]

// ── Constants ─────────────────────────────────────────────────────────────────
const COST_PER_KW = { economy: 900, medium: 1200, premium: 1600 }
const PANEL_W = 400
const DERATE = 0.80
const INV_HEADROOM = 1.20
const BAT_COVERAGE = 0.50
const DOD = 0.85
const CO2_FACTOR = 0.445
const DEGRADATION_RATE = 0.005
const TEMP_COEFF = -0.35 // %/°C for mono PERC

// Regional temperature above STC (25°C)
const REGION_DELTA_T = {
  'North Africa / Middle East': 35,
  'South / Southeast Asia':     32,
  'Sub-Saharan Africa':         30,
  'Southern Europe':            20,
  'Northern Europe':            10,
  'North America (South)':      25,
  'North America (North)':      12,
  'Latin America':              28,
  'Australia / Pacific':        28,
  'East Asia':                  18,
}

// Shading derate multipliers
const SHADING_DERATES = { none: 0, minimal: 0.05, moderate: 0.15, heavy: 0.30 }

// Demand charge per kW/month (mid-range for commercial/industrial)
const DEMAND_CHARGE = { commercial: 10, industrial: 12 }

// Shift multipliers for industrial
const SHIFT_MULTIPLIERS = { '1': 1, '2': 2, '3': 3 }

const roundValue = (value, digits = 2) => {
  if (!Number.isFinite(Number(value))) return 0
  const factor = 10 ** digits
  return Math.round(Number(value) * factor) / factor
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const systemTypeName = (value = '') => String(value || '').toLowerCase()

export function computeDesign(state = {}) {
  const sector = String(state.sector || 'residential').toLowerCase()
  const tariff = Math.max(0, toNumber(state.tariff, 0.12))
  const exportTariff = Math.max(0, toNumber(state.exportTariff, tariff * 0.5))
  const region = state.region || 'North Africa / Middle East'
  const systemName = systemTypeName(state.systemType)
  const isGridTied = systemName.includes('grid-tied only') || (systemName.includes('grid-tied') && !systemName.includes('hybrid'))
  const isHybrid = systemName.includes('hybrid')
  const isOffGrid = systemName.includes('off-grid')

  let dailyKWh = 0
  let peakDemandKW = 0

  if (sector === 'commercial') {
    const biz = COMMERCIAL_TYPES.find(b => b.id === state.commercialType)
    dailyKWh = biz ? toNumber(biz.dailyKWh, 200) : 200
  } else if (sector === 'industrial') {
    const ind = INDUSTRIAL_TYPES.find(i => i.id === state.industrialType)
    const shiftMul = SHIFT_MULTIPLIERS[String(state.shifts || '1')] || 1
    dailyKWh = ind ? toNumber(ind.dailyKWh, 1200) * shiftMul : 1200
    peakDemandKW = ind ? toNumber(ind.peakKW, 0) : 0
  } else {
    if (toNumber(state.bill, 0) > 0 && tariff > 0) {
      dailyKWh = (toNumber(state.bill, 0) / tariff) / 30
    } else {
      ;(state.selApps || []).forEach(id => {
        const app = APPLIANCES.find(a => a.id === id)
        if (!app) return
        const hrs = toNumber(state.appHrs?.[id], app.defaultHrs)
        dailyKWh += (toNumber(app.watts, 0) * hrs) / 1000
      })
    }
  }

  if (!Number.isFinite(dailyKWh) || dailyKWh < 1) dailyKWh = 12

  const sun = PEAK_SUN[region] || 5
  const derate = clamp(DERATE, 0.35, 0.95)
  const requiredKW = Math.max(0.1, dailyKWh / (sun * derate))
  const panels = Math.max(1, Math.ceil(requiredKW / (PANEL_W / 1000)))
  const systemKW = roundValue((panels * PANEL_W) / 1000, 1)
  const inverterKW = roundValue(Math.max(systemKW, 1) * INV_HEADROOM, 1)
  const batteryKWh = isGridTied ? 0 : roundValue((dailyKWh * BAT_COVERAGE / DOD), 1)

  const budget = String(state.budget || 'medium').toLowerCase()
  const budgetFactor = { economy: 0.85, medium: 1, premium: 1.3 }[budget] || 1
  const pvCostPerKw = 780 * budgetFactor
  const inverterCostPerKw = 210 * budgetFactor
  const batteryCostPerKwh = 240 * budgetFactor
  const bosCostPerKw = 180 * budgetFactor
  const labourCostPerKw = 200 * budgetFactor
  const permitCostPerKw = 60 * budgetFactor

  let pvPrice = systemKW * pvCostPerKw
  let inverterPrice = inverterKW * inverterCostPerKw
  let batteryPrice = batteryKWh * batteryCostPerKwh
  let bosPrice = systemKW * bosCostPerKw
  let labourPrice = systemKW * labourCostPerKw
  let permitPrice = systemKW * permitCostPerKw

  if (systemKW > 200) {
    pvPrice *= 0.82
    inverterPrice *= 0.82
    bosPrice *= 0.82
    labourPrice *= 0.82
    permitPrice *= 0.82
  } else if (systemKW > 50) {
    pvPrice *= 0.9
    inverterPrice *= 0.9
    bosPrice *= 0.9
    labourPrice *= 0.9
    permitPrice *= 0.9
  }

  const systemCost = roundValue(pvPrice + inverterPrice + batteryPrice + bosPrice + labourPrice + permitPrice, 0)

  // Annual generation is physically bounded by installed kWp × peak sun × 365 × derate.
  const annualGeneration = Math.max(0, systemKW * sun * 365 * derate)
  const selfConsumptionRate = batteryKWh > 0 ? clamp(0.68 + (batteryKWh / Math.max(1, dailyKWh)) * 0.1, 0.45, 0.9)
    : isGridTied ? 0.6 : isHybrid ? 0.7 : 0.5
  const annualImportOffset = annualGeneration * selfConsumptionRate * tariff
  const annualExportRevenue = annualGeneration * (1 - selfConsumptionRate) * exportTariff
  const annualBill = Math.max(0, toNumber(state.bill, 0) * 12)
  const energySavings = annualImportOffset + annualExportRevenue
  const cappedAnnualSavings = annualBill > 0 ? Math.min(energySavings, annualBill * 0.95) : energySavings

  let demandSavings = 0
  if (sector === 'commercial' || sector === 'industrial') {
    const dcRate = DEMAND_CHARGE[sector] || 10
    const peakReduction = clamp((systemKW * 0.35), 0, Math.max(peakDemandKW, systemKW))
    demandSavings = roundValue(peakReduction * dcRate * 12, 0)
  }

  const totalAnnualSavings = roundValue(cappedAnnualSavings + demandSavings, 0)
  const payback = totalAnnualSavings > 0 ? roundValue(systemCost / totalAnnualSavings, 1) : 0

  let lifetimeSavings = 0
  for (let yr = 0; yr < 25; yr++) {
    lifetimeSavings += totalAnnualSavings * Math.pow(1 - DEGRADATION_RATE, yr)
  }
  lifetimeSavings = Math.round(lifetimeSavings)

  const co2PerYear = roundValue((annualGeneration * (toNumber(state.co2Factor, CO2_FACTOR))) / 1000, 1)

  let powerFactorWarning = false
  let gridFeasibilityRequired = false
  let epcRequired = false
  if (sector === 'industrial') {
    const ind = INDUSTRIAL_TYPES.find(i => i.id === state.industrialType)
    powerFactorWarning = Boolean(ind?.motorHeavy)
    gridFeasibilityRequired = systemKW > 200
    epcRequired = systemKW > 200
  }

  return {
    sector,
    dailyKWh: roundValue(dailyKWh, 1),
    systemKW,
    panels,
    inverterKW,
    batteryKWh,
    systemCost,
    annualSavings: totalAnnualSavings,
    energySavings: roundValue(cappedAnnualSavings, 0),
    demandSavings,
    payback,
    lifetimeSavings,
    co2PerYear,
    peakSun: sun,
    peakDemandKW: roundValue(peakDemandKW, 1),
    powerFactorWarning,
    gridFeasibilityRequired,
    epcRequired,
    gridPhase: state.gridPhase || 'single',
    annualGeneration: roundValue(annualGeneration, 1),
    assumptionsVersion: 'audit/v2',
  }
}

export function calc(state) {
  return computeDesign(state)
}

// ── Phase 1.1 — PV Array Optimization Engine ──────────────────────────────────

export function optimizeArray(state) {
  const lat = parseFloat(state.latitude) || 30
  const lon = parseFloat(state.longitude) || 31
  const region = state.region || 'North Africa / Middle East'

  // Optimal tilt angle (Lorenzo 1994)
  let optimalTilt
  if (Math.abs(lat) > 50) {
    optimalTilt = Math.round(Math.abs(lat) * 0.87 * 10) / 10
  } else {
    optimalTilt = Math.round((Math.abs(lat) * 0.76 + 3.1) * 10) / 10
  }
  // Energy gain vs horizontal (approximate)
  const tiltGain = Math.round(Math.min(25, Math.max(5, Math.abs(lat) * 0.4)))

  // Optimal azimuth
  let optimalAzimuth = lat >= 0 ? 180 : 0 // south-facing in NH, north-facing in SH
  let azimuthNote = lat >= 0 ? 'South-facing (180°)' : 'North-facing (0°)'
  const nearEquator = Math.abs(lat) < 15
  if (nearEquator) {
    azimuthNote += ' — east-west bifacial layout may outperform at this latitude'
  }

  // String sizing (assume 14–16 panels per string for 48V system)
  const panelCount = state._panels || 11
  const panelsPerString = panelCount <= 16 ? panelCount : 15
  const strings = Math.floor(panelCount / panelsPerString)
  const remainderPanels = panelCount % panelsPerString
  const stringNote = remainderPanels > 0
    ? `${remainderPanels} remainder panel(s) — consider adjusting array size`
    : 'All panels fit evenly into strings'

  // Shading derate
  const shadingLevel = state.shading || 'none'
  const shadingDerate = SHADING_DERATES[shadingLevel] || 0
  const shadingMultiplier = 1 - shadingDerate

  // Temperature coefficient correction
  const deltaT = REGION_DELTA_T[region] || 20
  const tempDerate = 1 + (TEMP_COEFF / 100 * deltaT)
  const tempDeratePct = Math.round((1 - tempDerate) * 1000) / 10

  return {
    optimalTilt,
    tiltGain,
    optimalAzimuth,
    azimuthNote,
    nearEquator,
    strings: Math.max(1, strings),
    panelsPerString,
    remainderPanels,
    stringNote,
    shadingLevel,
    shadingDerate: Math.round(shadingDerate * 100),
    shadingMultiplier,
    tempDerate: Math.round(tempDerate * 1000) / 1000,
    tempDeratePct,
    deltaT,
    adjustedYield: Math.round(shadingMultiplier * tempDerate * 1000) / 10,
  }
}

// ── Phase 1.2 — Battery Optimization Engine ───────────────────────────────────

export function optimizeBattery(state, specs) {
  const batteryKWh = specs.batteryKWh || 0
  const dailyKWh = specs.dailyKWh || 12
  const isOffGrid = (state.systemType || '').toLowerCase().includes('off-grid')
  const isGridTied = (state.systemType || '').toLowerCase().includes('grid-tied only')

  // Autonomy
  const autonomyDays = batteryKWh > 0 ? Math.round((batteryKWh * DOD) / dailyKWh * 10) / 10 : 0
  let autonomyNote = ''
  if (isOffGrid && autonomyDays < 1) autonomyNote = 'Undersized for off-grid — recommend at least 1 day autonomy'
  else if (autonomyDays > 3) autonomyNote = 'Oversized — consider reducing battery to save cost'
  else if (batteryKWh > 0) autonomyNote = 'Good autonomy range for your system type'

  // Recommended autonomy-based battery
  const targetAutonomy = isOffGrid ? 2 : 1
  const recommendedBattery = Math.round((dailyKWh * targetAutonomy / DOD) * 10) / 10

  // Cycle life estimation
  const dailyDOD = batteryKWh > 0 ? Math.min(1, dailyKWh / (batteryKWh * 1)) : 0
  let expectedCycles
  if (dailyDOD <= 0.5) expectedCycles = 6000
  else if (dailyDOD <= 0.8) expectedCycles = 3500
  else expectedCycles = 2500
  const batteryLifeYears = batteryKWh > 0 ? Math.round((expectedCycles / 365) * 10) / 10 : 0

  // Self-consumption ratio (simplified model)
  const selfConsumptionRate = batteryKWh > 0
    ? Math.min(95, Math.round(60 + (batteryKWh / dailyKWh) * 30))
    : isGridTied ? 40 : 0

  // Minimum SoC recommendation
  const minSoC = 20 // LFP recommendation
  const maxUsableKWh = batteryKWh > 0 ? Math.round(batteryKWh * (1 - minSoC / 100) * 10) / 10 : 0

  return {
    autonomyDays,
    autonomyNote,
    recommendedBattery,
    dailyDOD: Math.round(dailyDOD * 100),
    expectedCycles,
    batteryLifeYears,
    selfConsumptionRate,
    minSoC,
    maxUsableKWh,
    chemistry: 'LFP (Lithium Iron Phosphate)',
  }
}

// ── Phase 1.3 — AI Energy Management Score ────────────────────────────────────

export function energyManagementScore(specs, state, arrayOpt, batteryOpt) {
  let score = 50
  const tips = []

  // Hybrid bonus
  const isHybrid = (state.systemType || '').toLowerCase().includes('hybrid')
  if (isHybrid) { score += 10 } else { tips.push('Switch to a hybrid system for better self-consumption') }

  // Battery autonomy
  if (batteryOpt) {
    if (batteryOpt.autonomyDays >= 1 && batteryOpt.autonomyDays <= 2) {
      score += 10
    } else if (batteryOpt.autonomyDays < 0.5 && (state.systemType || '').toLowerCase().includes('off-grid')) {
      score -= 10
      tips.push('Increase battery capacity — autonomy is too low for off-grid')
    }
  }

  // Tilt optimization
  if (arrayOpt) {
    const userTilt = parseFloat(state.tiltAngle) || arrayOpt.optimalTilt
    if (Math.abs(userTilt - arrayOpt.optimalTilt) <= 5) { score += 10 }
    else { tips.push(`Adjust tilt angle to ${arrayOpt.optimalTilt}° for optimal yield`) }

    // Azimuth
    const userAz = parseFloat(state.azimuth) || arrayOpt.optimalAzimuth
    if (Math.abs(userAz - arrayOpt.optimalAzimuth) <= 15) { score += 10 }
    else { tips.push(`Orient panels toward ${arrayOpt.azimuthNote} for maximum output`) }

    // Shading
    if (arrayOpt.shadingLevel === 'none' || arrayOpt.shadingLevel === 'minimal') { score += 10 }
    else { tips.push('Reduce shading — tree trimming or repositioning can increase yield significantly') }
  }

  // Inverter DC/AC ratio
  if (specs) {
    const dcAcRatio = specs.systemKW / specs.inverterKW
    if (dcAcRatio < 0.9) {
      score -= 10
      tips.push('Inverter is oversized relative to array — consider a smaller inverter to save cost')
    }
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
    recommendations: tips.slice(0, 3),
    label: score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs improvement',
  }
}

// ── Product Recommendations (sector-aware) ────────────────────────────────────

export function getProducts(specs, sector) {
  const s = sector || specs.sector || 'residential'
  const kw = specs.systemKW || 5

  if (s === 'industrial' || kw > 200) {
    return {
      panels: {
        name: `JA Solar DeepBlue 4.0 ${PANEL_W}W Bifacial`,
        spec: `${specs.panels} units · N-type TOPCon · 22.5% efficiency · 30yr warranty`,
        link: 'https://www.jasolar.com', supplier: 'JA Solar', badge: 'Industrial grade', commission: 0.02,
      },
      inverter: {
        name: `SMA Sunny Central ${Math.ceil(kw / 100) * 100}kW`,
        spec: `3-phase · Central inverter · Utility-scale · ${specs.inverterKW}kW rated`,
        link: 'https://www.sma.de', supplier: 'SMA', badge: 'Industrial grade', commission: 0.02,
        note: 'EPC contractor and DNO approval required',
      },
      battery: specs.batteryKWh > 0 ? {
        name: `CATL EnerC ${specs.batteryKWh}kWh`,
        spec: `LFP · Container-scale · 15yr warranty · IP55`,
        link: 'https://www.catl.com', supplier: 'CATL', badge: 'Grid-scale', commission: 0.02,
      } : null,
    }
  }

  if (s === 'commercial' || kw > 20) {
    return {
      panels: {
        name: `Canadian Solar HiKu7 ${PANEL_W}W`,
        spec: `${specs.panels} units · N-type TOPCon · 22.3% efficiency · 25yr warranty`,
        link: 'https://www.canadiansolar.com', supplier: 'Canadian Solar', badge: 'Commercial grade', commission: 0.03,
      },
      inverter: {
        name: specs.gridPhase === 'three' || kw > 50
          ? `Huawei SUN2000-${Math.ceil(kw / 10) * 10}KTL`
          : `SMA Tripower ${specs.inverterKW}kW`,
        spec: `3-phase · ${specs.inverterKW}kW · AI-powered MPPT · 10yr warranty`,
        link: specs.gridPhase === 'three' || kw > 50 ? 'https://solar.huawei.com' : 'https://www.sma.de',
        supplier: specs.gridPhase === 'three' || kw > 50 ? 'Huawei' : 'SMA',
        badge: 'Commercial grade', commission: 0.03,
      },
      battery: specs.batteryKWh > 0 ? {
        name: `BYD Battery-Box Commercial ${specs.batteryKWh}kWh`,
        spec: `LFP chemistry · Modular rack · 15yr warranty`,
        link: 'https://www.bydbatterybox.com', supplier: 'BYD', badge: 'Commercial grade', commission: 0.03,
      } : null,
    }
  }

  // Residential (default)
  return {
    panels: {
      name: `Jinko Solar Tiger Neo ${PANEL_W}W`,
      spec: `${specs.panels} units · Mono PERC · 22.3% efficiency · 25yr warranty`,
      link: 'https://www.jinkosolar.com', supplier: 'Jinko Solar', badge: 'Top pick', commission: 0.03,
    },
    inverter: {
      name: `Growatt SPH ${specs.inverterKW}kW Hybrid`,
      spec: `Wi-Fi monitoring · Dual MPPT · ${specs.inverterKW}kW rated`,
      link: 'https://www.ginverter.com', supplier: 'Growatt', badge: 'Top pick', commission: 0.03,
    },
    battery: specs.batteryKWh > 0 ? {
      name: `BYD Battery-Box Premium ${specs.batteryKWh}kWh`,
      spec: `LFP chemistry · 10yr warranty · Modular design`,
      link: 'https://www.bydbatterybox.com', supplier: 'BYD', badge: 'Top pick', commission: 0.03,
    } : null,
  }
}
