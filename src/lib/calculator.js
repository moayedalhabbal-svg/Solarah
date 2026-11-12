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

export const ASSUMPTIONS_VERSION = '2026.11-v1'

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
const PANEL_ROOF_AREA_M2 = { pitched: 2, flat: 3.5 }
const DERATE = 0.80
const INV_HEADROOM = 1.20
const BAT_COVERAGE = 0.50
const DOD = 0.85
const CO2_FACTOR = 0.445
const DEGRADATION_RATE = 0.005
const BATTERY_ROUND_TRIP_EFFICIENCY = 0.92
const DEFAULT_EXPORT_TARIFF = 0
const NPV_DISCOUNT_RATE = 0.08
const COMPONENT_COST_RATES = {
  pvPerKw: 780,
  inverterPerKw: 210,
  batteryPerKwh: 240,
  bosPerKw: 180,
  labourPerKw: 200,
  permitsPerKw: 60,
}
const DAYTIME_LOAD_FRACTION = {
  residential: 0.35,
  commercial: 0.65,
  industrial: 0.65,
}
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

// Shift multipliers for industrial
const SHIFT_MULTIPLIERS = { '1': 1, '2': 2, '3': 3 }

const roundValue = (value, digits = 2) => {
  if (!Number.isFinite(Number(value))) return 0
  const factor = 10 ** digits
  return Math.round(Number(value) * factor) / factor
}

const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const systemTypeName = (value = '') => String(value || '').toLowerCase()

function evaluateScenario({ panels, batteryKWh, model }) {
  const { dailyKWh, sun, derate, daytimeLoadFraction, batteryRoundTripEfficiency, tariff, exportTariff, budgetFactor, isOffGrid } = model
  const systemKW = roundValue((panels * PANEL_W) / 1000, 1)
  const inverterKW = panels > 0 ? roundValue(Math.max(systemKW, 1) * INV_HEADROOM, 1) : 0
  const rates = Object.fromEntries(
    Object.entries(COMPONENT_COST_RATES).map(([key, value]) => [key, value * budgetFactor]),
  )

  let scaleDiscount = 1
  if (systemKW > 200) scaleDiscount = 0.82
  else if (systemKW > 50) scaleDiscount = 0.9

  const costBreakdown = {
    pv: roundValue(systemKW * rates.pvPerKw * scaleDiscount, 0),
    inverter: roundValue(inverterKW * rates.inverterPerKw * scaleDiscount, 0),
    battery: roundValue(batteryKWh * rates.batteryPerKwh, 0),
    bos: roundValue(systemKW * rates.bosPerKw * scaleDiscount, 0),
    labour: roundValue(systemKW * rates.labourPerKw * scaleDiscount, 0),
    permits: roundValue(systemKW * rates.permitsPerKw * scaleDiscount, 0),
  }
  const cost = Object.values(costBreakdown).reduce((sum, component) => sum + component, 0)
  const annualGeneration = Math.max(0, systemKW * sun * 365 * derate)
  const dailyGeneration = annualGeneration / 365
  const daytimeLoad = dailyKWh * daytimeLoadFraction
  const directSelfConsumed = Math.min(dailyGeneration, daytimeLoad)
  const remainingLoad = Math.max(0, dailyKWh - directSelfConsumed)
  const solarSurplus = Math.max(0, dailyGeneration - directSelfConsumed)
  const batteryDelivered = batteryKWh > 0
    ? Math.min(solarSurplus * batteryRoundTripEfficiency, remainingLoad, batteryKWh * DOD)
    : 0
  const batteryChargeEnergy = batteryDelivered / batteryRoundTripEfficiency
  const dailySelfConsumed = directSelfConsumed + batteryDelivered
  const dailyExported = Math.max(0, dailyGeneration - directSelfConsumed - batteryChargeEnergy)
  const selfConsumedKWh = roundValue(dailySelfConsumed * 365, 1)
  const exportedKWh = roundValue(dailyExported * 365, 1)
  const annualSavings = roundValue(selfConsumedKWh * tariff + exportedKWh * exportTariff, 0)
  let cumulativeSavings = 0
  let payback = null
  let npv = -cost
  const annualProjection = Array.from({ length: 25 }, (_, index) => {
    const annualFactor = Math.pow(1 - DEGRADATION_RATE, index)
    const savings = annualSavings * annualFactor
    const previousCumulativeSavings = cumulativeSavings
    cumulativeSavings += savings
    npv += savings / Math.pow(1 + NPV_DISCOUNT_RATE, index + 1)
    if (payback === null && cost > 0 && cumulativeSavings >= cost) {
      payback = roundValue(index + (cost - previousCumulativeSavings) / savings, 2)
    }
    return {
      year: index + 1,
      annualSavings: roundValue(savings, 2),
    }
  })

  return {
    kWp: systemKW,
    panels,
    inverterKW,
    batteryKWh,
    cost,
    costBreakdown,
    annualSavings,
    payback,
    npv: roundValue(npv, 2),
    annualGeneration: roundValue(annualGeneration, 1),
    selfConsumedKWh,
    exportedKWh,
    importedKWh: roundValue(isOffGrid ? 0 : Math.max(0, dailyKWh - dailySelfConsumed) * 365, 1),
    annualProjection,
  }
}

export function computeDesign(state = {}) {
  const sector = String(state.sector || 'residential').toLowerCase()
  const tariff = Math.max(0, toNumber(state.tariff, 0.12))
  const exportTariff = Math.max(0, toNumber(state.exportTariff, DEFAULT_EXPORT_TARIFF))
  const costCurrency = 'USD'
  const savingsCurrency = 'USD'
  const region = state.region || 'North Africa / Middle East'
  const systemName = systemTypeName(state.systemType)
  const isGridTied = systemName.includes('grid-tied only') || (systemName.includes('grid-tied') && !systemName.includes('hybrid'))
  const isOffGrid = systemName.includes('off-grid')

  let dailyKWh = 0
  let peakDemandKW = 0
  let loadSource = 'minimum_load_fallback'

  if (sector === 'commercial') {
    const biz = COMMERCIAL_TYPES.find(b => b.id === state.commercialType)
    dailyKWh = biz ? toNumber(biz.dailyKWh, 200) : 200
    loadSource = 'commercial_baseline'
  } else if (sector === 'industrial') {
    const ind = INDUSTRIAL_TYPES.find(i => i.id === state.industrialType)
    const shiftMul = SHIFT_MULTIPLIERS[String(state.shifts || '1')] || 1
    dailyKWh = ind ? toNumber(ind.dailyKWh, 1200) * shiftMul : 1200
    peakDemandKW = ind ? toNumber(ind.peakKW, 0) : 0
    loadSource = 'industrial_baseline'
  } else {
    if (toNumber(state.bill, 0) > 0 && tariff > 0) {
      dailyKWh = (toNumber(state.bill, 0) / tariff) / 30
      loadSource = 'monthly_bill'
    } else {
      ;(state.selApps || []).forEach(id => {
        const app = APPLIANCES.find(a => a.id === id)
        if (!app) return
        const hrs = toNumber(state.appHrs?.[id], app.defaultHrs)
        dailyKWh += (toNumber(app.watts, 0) * hrs) / 1000
      })
      if (dailyKWh > 0) loadSource = 'appliance_list'
    }
  }

  if (!Number.isFinite(dailyKWh) || dailyKWh < 1) {
    dailyKWh = 12
    loadSource = 'minimum_load_fallback'
  }

  const sun = PEAK_SUN[region] || 5
  const derate = clamp(DERATE, 0.35, 0.95)
  const requiredKW = Math.max(0.1, dailyKWh / (sun * derate))
  const fullOffsetPanels = Math.max(1, Math.ceil(requiredKW / (PANEL_W / 1000)))
  const roofAreaInput = state.roofArea
  const hasRoofArea = roofAreaInput !== undefined && roofAreaInput !== null && Number.isFinite(Number(roofAreaInput))
  const roofArea = hasRoofArea ? Math.max(0, toNumber(roofAreaInput)) : null
  const roofType = state.roofType === 'flat' ? 'flat' : 'pitched'
  const roofPanelsFit = roofArea === null ? null : Math.floor(roofArea / PANEL_ROOF_AREA_M2[roofType])
  const panels = roofPanelsFit === null ? fullOffsetPanels : Math.min(fullOffsetPanels, roofPanelsFit)
  const roofLimited = panels < fullOffsetPanels
  const systemKW = roundValue((panels * PANEL_W) / 1000, 1)
  const inverterKW = panels > 0 ? roundValue(Math.max(systemKW, 1) * INV_HEADROOM, 1) : 0
  const batteryKWh = isGridTied || panels === 0 ? 0 : roundValue((dailyKWh * BAT_COVERAGE / DOD), 1)

  const budget = String(state.budget || 'medium').toLowerCase()
  const budgetFactor = { economy: 0.85, medium: 1, premium: 1.3 }[budget] || 1
  const pvCostPerKw = COMPONENT_COST_RATES.pvPerKw * budgetFactor
  const inverterCostPerKw = COMPONENT_COST_RATES.inverterPerKw * budgetFactor
  const batteryCostPerKwh = COMPONENT_COST_RATES.batteryPerKwh * budgetFactor
  const bosCostPerKw = COMPONENT_COST_RATES.bosPerKw * budgetFactor
  const labourCostPerKw = COMPONENT_COST_RATES.labourPerKw * budgetFactor
  const permitCostPerKw = COMPONENT_COST_RATES.permitsPerKw * budgetFactor

  let pvPrice = systemKW * pvCostPerKw
  let inverterPrice = inverterKW * inverterCostPerKw
  const batteryPrice = batteryKWh * batteryCostPerKwh
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

  const costBreakdown = {
    pv: roundValue(pvPrice, 0),
    inverter: roundValue(inverterPrice, 0),
    battery: roundValue(batteryPrice, 0),
    bos: roundValue(bosPrice, 0),
    labour: roundValue(labourPrice, 0),
    permits: roundValue(permitPrice, 0),
  }
  const systemCost = Object.values(costBreakdown).reduce((sum, component) => sum + component, 0)

  // Annual generation is physically bounded by installed kWp × peak sun × 365 × derate.
  const annualGeneration = Math.max(0, systemKW * sun * 365 * derate)
  const daytimeLoadFraction = clamp(
    toNumber(state.daytimeLoadFraction, DAYTIME_LOAD_FRACTION[sector] ?? 0.5),
    0,
    1,
  )
  const batteryRoundTripEfficiency = clamp(
    toNumber(state.batteryRoundTripEfficiency, BATTERY_ROUND_TRIP_EFFICIENCY),
    0.01,
    1,
  )
  const dailyGeneration = annualGeneration / 365
  const daytimeLoad = dailyKWh * daytimeLoadFraction
  const directSelfConsumed = Math.min(dailyGeneration, daytimeLoad)
  const remainingLoad = Math.max(0, dailyKWh - directSelfConsumed)
  const solarSurplus = Math.max(0, dailyGeneration - directSelfConsumed)
  const batteryDelivered = batteryKWh > 0
    ? Math.min(solarSurplus * batteryRoundTripEfficiency, remainingLoad, batteryKWh * DOD)
    : 0
  const batteryChargeEnergy = batteryDelivered / batteryRoundTripEfficiency
  const batteryLossKWh = roundValue(
    Math.max(0, batteryChargeEnergy - batteryDelivered) * 365,
    1,
  )
  const dailySelfConsumed = directSelfConsumed + batteryDelivered
  const dailyExported = Math.max(0, dailyGeneration - directSelfConsumed - batteryChargeEnergy)
  const dailyImported = isOffGrid ? 0 : Math.max(0, dailyKWh - dailySelfConsumed)
  const dailyUnserved = isOffGrid ? Math.max(0, dailyKWh - dailySelfConsumed) : 0
  const selfConsumedKWh = roundValue(dailySelfConsumed * 365, 1)
  const exportedKWh = roundValue(dailyExported * 365, 1)
  const importedKWh = roundValue(dailyImported * 365, 1)
  const unservedKWh = roundValue(dailyUnserved * 365, 1)
  const energySavings = selfConsumedKWh * tariff + exportedKWh * exportTariff
  const annualSavings = roundValue(energySavings, 0)
  const co2Factor = toNumber(state.co2Factor, CO2_FACTOR)
  const selfConsumptionRate = annualGeneration > 0
    ? roundValue((selfConsumedKWh / annualGeneration) * 100, 1)
    : 0
  const roofLoadCoveragePercent = dailyKWh > 0
    ? roundValue((selfConsumedKWh / (dailyKWh * 365)) * 100, 1)
    : 0
  const demandSavings = 0

  let cumulativeSavings = 0
  let cumulativeCo2Tonnes = 0
  let payback = null
  const annualProjection = Array.from({ length: 25 }, (_, index) => {
    const annualFactor = Math.pow(1 - DEGRADATION_RATE, index)
    const annualGenerationForYear = annualGeneration * annualFactor
    const annualSavingsForYear = annualSavings * annualFactor
    const annualCo2ForYear = annualGenerationForYear * co2Factor / 1000
    const previousCumulativeSavings = cumulativeSavings
    cumulativeSavings += annualSavingsForYear
    cumulativeCo2Tonnes += annualCo2ForYear
    if (payback === null && systemCost > 0 && cumulativeSavings >= systemCost) {
      payback = roundValue(
        index + (systemCost - previousCumulativeSavings) / annualSavingsForYear,
        2,
      )
    }
    return {
      year: index + 1,
      annualGeneration: roundValue(annualGenerationForYear, 1),
      annualSavings: roundValue(annualSavingsForYear, 2),
      cumulativeSavings: roundValue(cumulativeSavings, 2),
      annualCo2Tonnes: roundValue(annualCo2ForYear, 3),
      cumulativeCo2Tonnes: roundValue(cumulativeCo2Tonnes, 2),
    }
  })
  const lifetimeSavings = Math.round(cumulativeSavings)
  const paybackStatus = payback === null ? 'not_reached' : 'calculated'

  const co2PerYear = roundValue((annualGeneration * co2Factor) / 1000, 1)

  const scenarioModel = {
    dailyKWh,
    sun,
    derate,
    daytimeLoadFraction,
    batteryRoundTripEfficiency,
    tariff,
    exportTariff,
    budgetFactor,
    isOffGrid,
  }
  const fullOffset = evaluateScenario({ panels, batteryKWh, model: scenarioModel })
  const balancedCandidates = Array.from({ length: 8 }, (_, index) => Math.ceil(panels * (0.3 + index * 0.1)))
    .filter((candidate, index, list) => list.indexOf(candidate) === index)
    .map(candidatePanels => evaluateScenario({
      panels: candidatePanels,
      batteryKWh,
      model: scenarioModel,
    }))
  const balanced = balancedCandidates.reduce((best, candidate) => candidate.npv > best.npv ? candidate : best)
  const isHybrid = systemName.includes('hybrid')
  const hybridNoBattery = isHybrid
    ? evaluateScenario({ panels: balanced.panels, batteryKWh: 0, model: scenarioModel })
    : null
  const alternatives = {
    fullOffset: { ...fullOffset, label: 'Full-offset' },
    balanced: { ...balanced, label: 'Balanced' },
    ...(hybridNoBattery ? { hybridNoBattery: { ...hybridNoBattery, label: 'Balanced PV, no battery' } } : {}),
  }
  const recommendedAlternative = Object.entries(alternatives).reduce((best, [key, candidate]) => (
    candidate.npv > alternatives[best].npv ? key : best
  ), 'fullOffset')
  Object.entries(alternatives).forEach(([key, candidate]) => {
    candidate.recommended = key === recommendedAlternative
  })

  let powerFactorWarning = false
  let gridFeasibilityRequired = false
  let epcRequired = false
  if (sector === 'industrial') {
    const ind = INDUSTRIAL_TYPES.find(i => i.id === state.industrialType)
    powerFactorWarning = Boolean(ind?.motorHeavy)
    gridFeasibilityRequired = systemKW > 200
    epcRequired = systemKW > 200
  }

  return deepFreeze({
    sector,
    loadSource,
    dailyKWh: roundValue(dailyKWh, 1),
    systemKW,
    panels,
    inverterKW,
    batteryKWh,
    systemCost,
    annualSavings,
    energySavings: annualSavings,
    demandSavings,
    payback,
    paybackStatus,
    lifetimeSavings,
    annualProjection,
    co2PerYear,
    peakSun: sun,
    peakDemandKW: roundValue(peakDemandKW, 1),
    powerFactorWarning,
    gridFeasibilityRequired,
    epcRequired,
    gridPhase: state.gridPhase || 'single',
    annualGeneration: roundValue(annualGeneration, 1),
    costBreakdown,
    alternatives,
    recommendedAlternative,
    npvDiscountRate: NPV_DISCOUNT_RATE,
    selfConsumedKWh,
    exportedKWh,
    importedKWh,
    batteryLossKWh,
    unservedKWh,
    exportTariff,
    costCurrency,
    savingsCurrency,
    selfConsumptionRate,
    roofLimited,
    roofAreaM2: roofArea,
    roofType,
    roofPanelsFit,
    roofLoadCoveragePercent,
    daytimeLoadFraction,
    batteryRoundTripEfficiency,
    assumptionsVersion: ASSUMPTIONS_VERSION,
    assumptions: {
      panelW: PANEL_W,
      derate,
      peakSunHours: sun,
      pvCostPerKw,
      inverterCostPerKw,
      batteryCostPerKwh,
      bosCostPerKw,
      labourCostPerKw,
      permitCostPerKw,
      depthOfDischarge: DOD,
      degradationRate: DEGRADATION_RATE,
      co2Factor,
      roofAreaM2: roofArea,
      roofType,
      panelRoofAreaM2: PANEL_ROOF_AREA_M2[roofType],
    },
  })
}

export function calc(state) {
  return computeDesign(state)
}

export const PAYBACK_NOT_RECOVERED = 'Not recovered within 25 years at current assumptions'

export function formatPayback(value, translate = (_key, { defaultValue }) => defaultValue) {
  const years = Number(value)
  if (value == null || !Number.isFinite(years) || years < 0 || years > 25) {
    return translate('paybackNotRecovered', { defaultValue: PAYBACK_NOT_RECOVERED })
  }
  return translate('paybackYears', {
    years,
    defaultValue: `${years} years`,
  })
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
