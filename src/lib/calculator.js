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

// Cost per kW installed by budget tier (USD equivalent)
const COST_PER_KW = { economy: 900, medium: 1200, premium: 1600 }

// Panel wattage assumed
const PANEL_W = 400

// System derate factor (accounts for wiring loss, temperature, soiling)
const DERATE = 0.80

// Inverter oversizing headroom
const INV_HEADROOM = 1.20

// Battery coverage (fraction of daily load)
const BAT_COVERAGE = 0.50

// CO2 grid emission factor (kg CO2 per kWh — global average)
const CO2_FACTOR = 0.40

/**
 * Main calculation function.
 * @param {object} state - calculator state
 * @returns {object} - computed system specifications
 */
export function calc(state) {
  // 1. Determine daily kWh load
  let dailyKWh = 0
  if (state.bill > 0) {
    // Convert monthly bill to daily kWh using tariff
    dailyKWh = (state.bill / state.tariff) / 30
  } else {
    state.selApps.forEach(id => {
      const app = APPLIANCES.find(a => a.id === id)
      const hrs = state.appHrs[id] ?? app.defaultHrs
      dailyKWh += (app.watts * hrs) / 1000
    })
  }
  if (dailyKWh < 1) dailyKWh = 12 // fallback minimum

  // 2. System sizing
  const sun = PEAK_SUN[state.region] || 5
  const systemKW = dailyKWh / (sun * DERATE)
  const panels = Math.ceil(systemKW / (PANEL_W / 1000))
  const actualKW = Math.round((panels * PANEL_W) / 1000 * 10) / 10
  const inverterKW = Math.round(systemKW * INV_HEADROOM * 10) / 10
  const batteryKWh = Math.round(dailyKWh * BAT_COVERAGE * 10) / 10

  // 3. Financials
  const cpp = COST_PER_KW[state.budget] || 1200
  const systemCost = Math.round(actualKW * cpp)
  const annualKWh = dailyKWh * 365
  const annualSavings = Math.round(annualKWh * state.tariff)
  const payback = annualSavings > 0 ? Math.round((systemCost / annualSavings) * 10) / 10 : 0
  const lifetimeSavings = Math.round(annualSavings * 25)

  // 4. Environmental
  const co2PerYear = Math.round((annualKWh * CO2_FACTOR) / 1000 * 10) / 10

  return {
    dailyKWh:       Math.round(dailyKWh * 10) / 10,
    systemKW:       actualKW,
    panels,
    inverterKW:     Math.round(inverterKW * 10) / 10,
    batteryKWh,
    systemCost,
    annualSavings,
    payback,
    lifetimeSavings,
    co2PerYear,
    peakSun:        sun,
  }
}

/**
 * Get product recommendations based on system specs.
 * In production these would be real affiliate links from your DB.
 */
export function getProducts(specs) {
  return {
    panels: {
      name:     `Jinko Solar Tiger Neo ${PANEL_W}W`,
      spec:     `${specs.panels} units · Mono PERC · 22.3% efficiency · 25yr warranty`,
      link:     'https://www.jinkosolar.com',
      supplier: 'Jinko Solar',
      badge:    'Top pick',
      commission: 0.03, // 3%
    },
    inverter: {
      name:     `Growatt SPH ${specs.inverterKW}kW Hybrid`,
      spec:     `Wi-Fi monitoring · Dual MPPT · ${specs.inverterKW}kW rated`,
      link:     'https://www.ginverter.com',
      supplier: 'Growatt',
      badge:    'Top pick',
      commission: 0.03,
    },
    battery: {
      name:     `BYD Battery-Box Premium ${specs.batteryKWh}kWh`,
      spec:     `LFP chemistry · 10yr warranty · Modular design`,
      link:     'https://www.bydbatterybox.com',
      supplier: 'BYD',
      badge:    'Top pick',
      commission: 0.03,
    },
  }
}
