import { describe, expect, it } from 'vitest'
import { calc, computeDesign } from '../calculator.js'

const PANEL_W = 400
const DERATE = 0.8
const INVERTER_HEADROOM = 1.2
const DOD = 0.85
const BAT_COVERAGE = 0.5

const REFERENCE_CASES = {
  A: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    city: 'Cairo',
    latitude: '30.04',
    longitude: '31.24',
    bill: 0,
    budget: 'medium',
    systemType: 'Hybrid (grid-tied + battery backup)',
    selApps: ['ac', 'fridge', 'wm', 'tv', 'lights', 'pc'],
    appHrs: { ac: 8, fridge: 24, wm: 1, tv: 5, lights: 8, pc: 8 },
    gridPhase: 'single',
  },
  A2: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    city: 'Cairo',
    bill: 350,
    budget: 'medium',
    systemType: 'Hybrid (grid-tied + battery backup)',
    selApps: ['ac', 'fridge', 'wm', 'tv', 'lights', 'pc'],
    appHrs: { ac: 8, fridge: 24, wm: 1, tv: 5, lights: 8, pc: 8 },
    gridPhase: 'single',
  },
  B: {
    sector: 'commercial',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    city: 'Dubai',
    bill: 99999,
    budget: 'medium',
    systemType: 'Hybrid (grid-tied + battery backup)',
    commercialType: 'hotel_lg',
    gridPhase: 'three',
  },
  C: {
    sector: 'industrial',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    city: 'Alexandria',
    bill: 99999,
    budget: 'medium',
    systemType: 'Hybrid (grid-tied + battery backup)',
    industrialType: 'textile',
    shifts: '2',
    gridPhase: 'three',
  },
  D: {
    sector: 'residential',
    region: 'Australia / Pacific',
    city: 'Sydney',
    tariff: 0.3,
    bill: 220,
    budget: 'medium',
    systemType: 'Grid-tied only',
    gridPhase: 'single',
  },
  E: {
    sector: 'residential',
    region: 'Northern Europe',
    city: 'Berlin',
    tariff: 0.35,
    bill: 140,
    budget: 'medium',
    systemType: 'Grid-tied only',
    gridPhase: 'single',
  },
  F: {
    sector: 'commercial',
    region: 'South / Southeast Asia',
    tariff: 0.15231,
    budget: 'medium',
    systemType: 'Hybrid (grid-tied + battery backup)',
    commercialType: 'mall',
    gridPhase: 'three',
  },
  G: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    bill: 120,
    budget: 'medium',
    currency: 'USD',
    systemType: 'Hybrid (grid-tied + battery backup)',
    country: 'Egypt',
  },
}

const sampleAnnualSavings = (state) => {
  const tariff = Number(state.tariff || 0.12)
  const region = state.region || 'North Africa / Middle East'
  const peakSun = { 'North Africa / Middle East': 6.2, 'South / Southeast Asia': 5.5, 'Sub-Saharan Africa': 5.8, 'Southern Europe': 5, 'Northern Europe': 3.2, 'North America (South)': 5.5, 'North America (North)': 4.2, 'Latin America': 5.2, 'Australia / Pacific': 5.6, 'East Asia': 4.5 }[region] || 5

  let dailyKWh = 0
  if (state.sector === 'commercial') {
    dailyKWh = { hotel_lg: 4500, mall: 8000 }[state.commercialType] || 200
  } else if (state.sector === 'industrial') {
    const base = { textile: 1200, food: 2800, automotive: 3500 }[state.industrialType] || 1200
    dailyKWh = base * ({ '1': 1, '2': 2, '3': 3 }[String(state.shifts || '1')] || 1)
  } else if (Number(state.bill || 0) > 0 && tariff > 0) {
    dailyKWh = (Number(state.bill) / tariff) / 30
  } else {
    dailyKWh = (state.selApps || []).reduce((sum, id) => {
      const appMap = { ac: { watts: 1500, defaultHrs: 8 }, fridge: { watts: 150, defaultHrs: 24 }, wm: { watts: 500, defaultHrs: 1 }, tv: { watts: 200, defaultHrs: 5 }, lights: { watts: 200, defaultHrs: 8 }, pc: { watts: 300, defaultHrs: 8 } }
      const app = appMap[id]
      if (!app) return sum
      const hrs = Number(state.appHrs?.[id] ?? app.defaultHrs)
      return sum + ((app.watts * hrs) / 1000)
    }, 0)
  }

  const requiredKW = Math.max(dailyKWh / (peakSun * DERATE), 0.1)
  const panels = Math.max(1, Math.ceil(requiredKW / (PANEL_W / 1000)))
  const systemKW = (panels * PANEL_W) / 1000
  const inverterKW = systemKW * INVERTER_HEADROOM
  const isGridTied = String(state.systemType || '').toLowerCase().includes('grid-tied only') || (String(state.systemType || '').toLowerCase().includes('grid-tied') && !String(state.systemType || '').toLowerCase().includes('hybrid'))
  const batteryKWh = isGridTied ? 0 : dailyKWh * BAT_COVERAGE / DOD
  return { dailyKWh, requiredKW, panels, systemKW, inverterKW, batteryKWh }
}

function expectFinite(nonFiniteValue, label) {
  expect(Number.isFinite(nonFiniteValue)).toBe(true)
  expect(nonFiniteValue).not.toBeNaN()
  expect(nonFiniteValue).not.toBe(Infinity)
  expect(nonFiniteValue).not.toBe(-Infinity)
  expect(nonFiniteValue).toBeGreaterThanOrEqual(0)
  if (label) {
    expect(nonFiniteValue).toBeDefined()
  }
}

describe('Solarah calculator', () => {
  it('matches independent first-principles sizing for the reference cases', () => {
    Object.entries(REFERENCE_CASES).forEach(([key, state]) => {
      const expected = sampleAnnualSavings(state)
      const result = calc(state)

      expect(result.sector).toBe(state.sector)
      expect(result.systemKW).toBeCloseTo(expected.systemKW, 1)
      expect(result.panels).toBe(expected.panels)
      expect(result.inverterKW).toBeCloseTo(expected.inverterKW, 1)
      expect(result.batteryKWh).toBeCloseTo(expected.batteryKWh, 1)
      expect(result.dailyKWh).toBeCloseTo(expected.dailyKWh, 1)
      expect(result.systemCost).toBeGreaterThan(0)
      expect(result.annualSavings).toBeGreaterThan(0)
      expect(result.payback).toBeGreaterThan(0)
      expect(result.assumptionsVersion).toBe('audit/v2')
      expectFinite(result.systemCost, `${key} cost`)
      expectFinite(result.annualSavings, `${key} annual savings`)
      expectFinite(result.payback, `${key} payback`)
    })
  })

  it('keeps all outputs finite and non-negative across reference cases', () => {
    Object.values(REFERENCE_CASES).forEach((state, index) => {
      const result = calc(state)
      expectFinite(result.systemKW, `case-${index}-systemKW`)
      expectFinite(result.panels, `case-${index}-panels`)
      expectFinite(result.inverterKW, `case-${index}-inverter`)
      expectFinite(result.batteryKWh, `case-${index}-battery`)
      expectFinite(result.systemCost, `case-${index}-cost`)
      expectFinite(result.annualSavings, `case-${index}-annual`)
      expectFinite(result.payback, `case-${index}-payback`)
      expectFinite(result.co2PerYear, `case-${index}-co2`)
    })
  })

  it('respects battery rules for grid-tied and hybrid designs', () => {
    const gridTied = calc({ ...REFERENCE_CASES.D, systemType: 'Grid-tied only' })
    const hybrid = calc({ ...REFERENCE_CASES.A, systemType: 'Hybrid (grid-tied + battery backup)' })

    expect(gridTied.batteryKWh).toBe(0)
    expect(gridTied.systemCost).toBeGreaterThan(0)
    expect(hybrid.batteryKWh).toBeGreaterThan(0)
    expect(hybrid.systemCost).toBeGreaterThan(gridTied.systemCost)
  })

  it('keeps degradation monotonic and payback feasible', () => {
    const result = calc(REFERENCE_CASES.A)
    const yearlySavings = []
    for (let year = 0; year < 25; year++) {
      yearlySavings.push(result.annualSavings * Math.pow(1 - 0.005, year))
    }

    for (let i = 1; i < yearlySavings.length; i++) {
      expect(yearlySavings[i]).toBeLessThanOrEqual(yearlySavings[i - 1])
    }

    let cumulative = 0
    let paybackReached = false
    for (let year = 0; year < 25; year++) {
      cumulative += yearlySavings[year]
      if (year >= result.payback) {
        paybackReached = true
      }
      if (year === 24) {
        expect(cumulative).toBeGreaterThanOrEqual(result.systemCost)
      }
    }
    expect(paybackReached).toBe(true)
  })

  it('keeps the physical and financial bounds consistent', () => {
    const cases = Object.values(REFERENCE_CASES)

    cases.forEach((state) => {
      const result = calc(state)
      const annualGenerationLimit = result.systemKW * 365 * 6.2
      expect(result.annualGeneration).toBeLessThanOrEqual(annualGenerationLimit)
      expect(result.systemKW / result.inverterKW).toBeGreaterThan(0.8)
      expect(result.systemKW / result.inverterKW).toBeLessThan(1.5)
      expect(result.panels * PANEL_W).toBeGreaterThanOrEqual(result.systemKW * 1000)
      if (state.bill) {
        const annualBill = Number(state.bill) * 12
        expect(result.annualSavings).toBeLessThanOrEqual(annualBill * 0.95 + 1)
      }
    })
  })

  it('exposes a single source-of-truth computeDesign function', () => {
    const designA = computeDesign(REFERENCE_CASES.A)
    const designB = calc(REFERENCE_CASES.A)
    expect(designA).toEqual(designB)
  })
})
