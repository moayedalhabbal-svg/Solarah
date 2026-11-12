import { describe, expect, it } from 'vitest'
import { computeDesign, formatPayback, PAYBACK_NOT_RECOVERED } from '../calculator.js'
import { computeDesignForConsumer, DESIGN_CONSUMERS, getReportDesign } from '../designConsumers.js'

// 365 is calendar arithmetic; leap years are intentionally outside this estimate.
const DAYS_PER_YEAR = 365
// UNVERIFIED aggregate derate used by the calculator; see METHODOLOGY.md.
const AGGREGATE_DERATE = 0.80
// UNVERIFIED: 400 W is the product-size assumption in the existing calculator,
// not a selected manufacturer datasheet.
const MODULE_POWER_W = 400
// UNVERIFIED: inherited emissions default; no country/year source was verified.
const GRID_CO2_FACTOR_KG_PER_KWH = 0.445

// UNVERIFIED: inherited software assumptions in src/lib/calculator.js; no site-specific,
// primary-source publication year was verified for these broad regional averages.
const SITE_PEAK_SUN_HOURS = {
  'North Africa / Middle East': 6.2,
  'South / Southeast Asia': 5.5,
  'Northern Europe': 3.2,
  'Australia / Pacific': 5.6,
}

describe('formatPayback', () => {
  it('formats recovered payback and gives one explicit message for unrecovered values', () => {
    expect(formatPayback(7.5)).toBe('7.5 years')
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, 26]) {
      expect(formatPayback(value)).toBe(PAYBACK_NOT_RECOVERED)
    }
  })
})

// UNVERIFIED software defaults, documented in METHODOLOGY.md: 400 W module, 0.80
// aggregate derate, 1.20 inverter sizing factor, 85% DoD, and 0.92 battery RTE.
// The component cost rates and 0.5% degradation are also UNVERIFIED.
const COSTS_USD = {
  pvPerKW: 780,
  inverterPerKW: 210,
  batteryPerKWh: 240,
  bosPerKW: 180,
  labourPerKW: 200,
  permitsPerKW: 60,
}

// Case tariffs and bills are fixed reproducibility inputs, not verified utility
// schedules. Cost is currently USD-based; currency conversion is not implemented.
const CASES = {
  A: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    city: 'Cairo',
    tariff: 0.06,
    exportTariff: 0,
    bill: 0,
    selApps: ['ac', 'fridge', 'wm', 'tv', 'lights', 'pc'],
    appHrs: { ac: 8, fridge: 24, wm: 1, tv: 5, lights: 8, pc: 8 },
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'single',
  },
  A2: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    city: 'Cairo',
    tariff: 0.06,
    exportTariff: 0,
    bill: 350,
    selApps: ['ac', 'fridge', 'wm', 'tv', 'lights', 'pc'],
    appHrs: { ac: 8, fridge: 24, wm: 1, tv: 5, lights: 8, pc: 8 },
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'single',
  },
  B: {
    sector: 'commercial',
    region: 'North Africa / Middle East',
    city: 'Dubai',
    tariff: 0.06,
    exportTariff: 0,
    bill: 99999,
    commercialType: 'hotel_lg',
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'three',
  },
  C: {
    sector: 'industrial',
    region: 'North Africa / Middle East',
    city: 'Alexandria',
    tariff: 0.06,
    exportTariff: 0,
    bill: 99999,
    industrialType: 'textile',
    shifts: '2',
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'three',
  },
  D: {
    sector: 'residential',
    region: 'Australia / Pacific',
    city: 'Sydney',
    tariff: 0.3,
    exportTariff: 0,
    bill: 220,
    systemType: 'Grid-tied only',
    budget: 'medium',
    gridPhase: 'single',
  },
  E: {
    sector: 'residential',
    region: 'Northern Europe',
    city: 'Berlin',
    tariff: 0.35,
    exportTariff: 0,
    bill: 140,
    systemType: 'Grid-tied only',
    budget: 'medium',
    gridPhase: 'single',
  },
  F: {
    sector: 'commercial',
    region: 'South / Southeast Asia',
    city: 'South/Southeast Asia reference site',
    tariff: 0.15231,
    exportTariff: 0,
    commercialType: 'mall',
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'three',
  },
  G: {
    sector: 'residential',
    region: 'North Africa / Middle East',
    tariff: 0.06,
    exportTariff: 0,
    bill: 120,
    currency: 'USD',
    country: 'Egypt',
    systemType: 'Hybrid (grid-tied + battery backup)',
    budget: 'medium',
    gridPhase: 'single',
  },
}

// Fixed expected results below were hand-calculated from the stated appliance
// ratings/default hours, sector baselines, region PSH values, cost line items,
// and the energy-flow equations in METHODOLOGY.md. They are fixtures, not a
// second executable implementation of computeDesign(). Rates and defaults remain
// UNVERIFIED, so these assertions check model arithmetic, not field accuracy.
const EXPECTED = {
  A:  { dailyKWh: 21.1, systemKW: 4.4, panels: 11, inverterKW: 5.3, batteryKWh: 12.4, systemCost: 9457, annualSavings: 393, payback: null, co2PerYear: 3.5, selfConsumedKWh: 6542.6, exportedKWh: 1088.6, importedKWh: 1158.9 },
  A2: { dailyKWh: 194.4, systemKW: 39.6, panels: 99, inverterKW: 47.5, batteryKWh: 114.4, systemCost: 85743, annualSavings: 3620, payback: null, co2PerYear: 31.9, selfConsumedKWh: 60332.9, exportedKWh: 8272.6, importedKWh: 10639.3 },
  B:  { dailyKWh: 4500, systemKW: 907.6, panels: 2269, inverterKW: 1089.1, batteryKWh: 2647.1, systemCost: 1730810, annualSavings: 95825, payback: 18.88, co2PerYear: 731.2, selfConsumedKWh: 1597079.5, exportedKWh: 0, importedKWh: 45420.5 },
  C:  { dailyKWh: 2400, systemKW: 484, panels: 1210, inverterKW: 580.8, batteryKWh: 1411.8, systemCost: 923039, annualSavings: 51101, payback: 18.88, co2PerYear: 389.9, selfConsumedKWh: 851686.9, exportedKWh: 0, importedKWh: 24313.1 },
  D:  { dailyKWh: 24.4, systemKW: 5.6, panels: 14, inverterKW: 6.7, batteryKWh: 0, systemCost: 8239, annualSavings: 937, payback: 8.97, co2PerYear: 4.1, selfConsumedKWh: 3122.8, exportedKWh: 6034.3, importedKWh: 5799.4 },
  E:  { dailyKWh: 13.3, systemKW: 5.6, panels: 14, inverterKW: 6.7, batteryKWh: 0, systemCost: 8239, annualSavings: 596, payback: 14.29, co2PerYear: 2.3, selfConsumedKWh: 1703.3, exportedKWh: 3529.3, importedKWh: 3163.3 },
  F:  { dailyKWh: 8000, systemKW: 1818.4, panels: 4546, inverterKW: 2182.1, batteryKWh: 4705.9, systemCost: 3324302, annualSavings: 432341, payback: 7.82, co2PerYear: 1299.6, selfConsumedKWh: 2838562.4, exportedKWh: 0, importedKWh: 81437.6 },
  G:  { dailyKWh: 66.7, systemKW: 13.6, panels: 34, inverterKW: 16.3, batteryKWh: 39.2, systemCost: 29423, annualSavings: 1241, payback: null, co2PerYear: 11, selfConsumedKWh: 20678.5, exportedKWh: 2885.4, importedKWh: 3654.9 },
}

// UNVERIFIED: appliance wattages are the platform's illustrative nameplate
// assumptions, not measured loads or manufacturer-specific values.
const CASE_A_APPLIANCE_WATTS = {
  ac: 1500,
  fridge: 150,
  wm: 500,
  tv: 200,
  lights: 200,
  pc: 300,
}

function expectWithinFivePercent(actual, expected) {
  expect(Number.isFinite(actual)).toBe(true)
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.max(Math.abs(expected) * 0.05, 0.05))
}

describe('computeDesign reference estimates', () => {
  it('matches hand-calculated engineering and financial outputs within 5%', () => {
    for (const [caseId, input] of Object.entries(CASES)) {
      const design = computeDesign(input)
      const expected = EXPECTED[caseId]

      for (const key of [
        'dailyKWh',
        'systemKW',
        'inverterKW',
        'batteryKWh',
        'systemCost',
        'annualSavings',
        'co2PerYear',
        'selfConsumedKWh',
        'exportedKWh',
        'importedKWh',
      ]) {
        expectWithinFivePercent(design[key], expected[key])
      }
      expect(design.panels).toBe(expected.panels)
      if (expected.payback === null) {
        expect(design.payback).toBeNull()
      } else {
        expectWithinFivePercent(design.payback, expected.payback)
      }
    }
  })

  it('selects a balanced size whose NPV is at least the full-offset case', () => {
    for (const input of [CASES.A, CASES.D, CASES.F]) {
      const design = computeDesign(input)
      const { alternatives } = design
      expect(alternatives.balanced.npv).toBeGreaterThanOrEqual(alternatives.fullOffset.npv)
      expect(alternatives.balanced.recommended || alternatives.fullOffset.recommended || alternatives.hybridNoBattery?.recommended).toBe(true)
      expect(alternatives.fullOffset).toMatchObject({
        kWp: design.systemKW,
        panels: design.panels,
        cost: design.systemCost,
        annualSavings: design.annualSavings,
        payback: design.payback,
      })
    }
  })

  it('keeps battery capex at zero for grid-tied scenarios and includes a hybrid no-battery option', () => {
    const gridTied = computeDesign(CASES.D)
    expect(gridTied.alternatives.fullOffset.costBreakdown.battery).toBe(0)
    expect(gridTied.alternatives.balanced.costBreakdown.battery).toBe(0)
    expect(gridTied.alternatives.hybridNoBattery).toBeUndefined()

    const hybrid = computeDesign(CASES.A).alternatives
    expect(hybrid.hybridNoBattery.panels).toBe(hybrid.balanced.panels)
    expect(hybrid.hybridNoBattery.batteryKWh).toBe(0)
    expect(hybrid.hybridNoBattery.costBreakdown.battery).toBe(0)
  })

  it('caps a mall design to its flat-roof area and reports modeled load coverage', () => {
    const design = computeDesign({ ...CASES.F, roofArea: 1000, roofType: 'flat' })

    expect(design.panels).toBe(Math.floor(1000 / 3.5))
    expect(design.roofLimited).toBe(true)
    expect(design.roofLoadCoveragePercent).toBeCloseTo(6.3, 1)
    expect(design.annualGeneration).toBeLessThanOrEqual(
      design.systemKW * SITE_PEAK_SUN_HOURS[CASES.F.region] * DAYS_PER_YEAR * AGGREGATE_DERATE,
    )
  })

  it('returns a zero-capacity design when no panel fits the specified roof area', () => {
    const design = computeDesign({ ...CASES.A, roofArea: 0 })

    expect(design.roofLimited).toBe(true)
    expect(design.panels).toBe(0)
    expect(design.systemKW).toBe(0)
    expect(design.batteryKWh).toBe(0)
    expect(design.systemCost).toBe(0)
    expect(design.roofLoadCoveragePercent).toBe(0)
  })

  it('uses the intended input source for each reference case', () => {
    const applianceDailyKWh = (
      CASE_A_APPLIANCE_WATTS.ac * 8
      + CASE_A_APPLIANCE_WATTS.fridge * 24
      + CASE_A_APPLIANCE_WATTS.wm * 1
      + CASE_A_APPLIANCE_WATTS.tv * 5
      + CASE_A_APPLIANCE_WATTS.lights * 8
      + CASE_A_APPLIANCE_WATTS.pc * 8
    ) / 1000
    expect(applianceDailyKWh).toBeCloseTo(21.1, 1)
    expectWithinFivePercent(computeDesign(CASES.A).dailyKWh, applianceDailyKWh)
    expectWithinFivePercent(computeDesign(CASES.A2).dailyKWh, 350 / 0.06 / 30)

    expect(computeDesign(CASES.A).loadSource).toBe('appliance_list')
    expect(computeDesign(CASES.A2).loadSource).toBe('monthly_bill')
  })

  it('treats bill-derived loads and all calculated money values as USD', () => {
    const design = computeDesign({ sector: 'residential', bill: 120, tariff: 0.06, currency: 'EGP' })

    expect(design.dailyKWh).toBeCloseTo(66.7, 1)
    expect(design.costCurrency).toBe('USD')
    expect(design.savingsCurrency).toBe('USD')
    expect(computeDesign(CASES.B).loadSource).toBe('commercial_baseline')
    expect(computeDesign(CASES.C).loadSource).toBe('industrial_baseline')
    expect(computeDesign(CASES.F).dailyKWh).toBe(8000)
    expect(computeDesign(CASES.F).peakSun).toBe(5.5)
  })

  it('derives CO2 expectations from generation and the explicitly unverified factor', () => {
    for (const [caseId, input] of Object.entries(CASES)) {
      const design = computeDesign(input)
      const expectedTonnes = Math.round(
        (design.systemKW
          * SITE_PEAK_SUN_HOURS[input.region]
          * DAYS_PER_YEAR
          * AGGREGATE_DERATE
          * GRID_CO2_FACTOR_KG_PER_KWH
          / 1000) * 10,
      ) / 10
      expectWithinFivePercent(design.co2PerYear, expectedTonnes)
      expectWithinFivePercent(design.panels * MODULE_POWER_W / 1000, design.systemKW)
    }
  })

  it('matches capex from the component line items', () => {
    const design = computeDesign(CASES.A)
    const { costBreakdown } = design
    const itemizedCost = Object.values(costBreakdown).reduce((sum, item) => sum + item, 0)

    expect(costBreakdown).toEqual({
      pv: 3432,
      inverter: 1113,
      battery: 2976,
      bos: 792,
      labour: 880,
      permits: 264,
    })
    expect(itemizedCost).toBe(design.systemCost)
    expectWithinFivePercent(design.systemCost, EXPECTED.A.systemCost)
    expect(COSTS_USD.pvPerKW + COSTS_USD.bosPerKW + COSTS_USD.labourPerKW + COSTS_USD.permitsPerKW).toBe(1220)
  })

  it('uses the modeled annual energy flows directly for savings, with no bill cap', () => {
    for (const [caseId, state] of Object.entries(CASES)) {
      const design = computeDesign(state)
      const expectedSavings = design.selfConsumedKWh * state.tariff
        + design.exportedKWh * design.exportTariff
      expect(design.annualSavings).toBe(Math.round(expectedSavings))
      expect(design.exportTariff).toBe(0)
      expect(design.annualSavings).toBe(EXPECTED[caseId].annualSavings)
    }

    // Synthetic expert-input scenario; this is not a verified export tariff.
    const withExportCredit = computeDesign({ ...CASES.D, exportTariff: 0.05 })
    expect(withExportCredit.annualSavings).toBeGreaterThan(computeDesign(CASES.D).annualSavings)
  })

  it('normalizes legacy currency inputs to USD', () => {
    const design = computeDesign({ ...CASES.D, currency: 'EUR' })
    expect(design.costCurrency).toBe('USD')
    expect(design.savingsCurrency).toBe('USD')
    expect(design.paybackStatus).not.toBe('currency_mismatch')
  })

  it('uses each site region peak-sun value for the annual generation upper bound', () => {
    for (const state of Object.values(CASES)) {
      const design = computeDesign(state)
      const sitePeakSun = SITE_PEAK_SUN_HOURS[state.region]
      expect(sitePeakSun).toBeDefined()
      expect(design.annualGeneration).toBeLessThanOrEqual(
        design.systemKW * sitePeakSun * DAYS_PER_YEAR,
      )
      expect(design.panels * MODULE_POWER_W).toBeGreaterThanOrEqual(design.systemKW * 1000)
    }
  })

  it('uses the same computed outputs in every registered consumer for cases A-G', () => {
    const outputKeys = [
      'dailyKWh', 'systemKW', 'panels', 'inverterKW', 'batteryKWh',
      'systemCost', 'annualSavings', 'lifetimeSavings', 'payback', 'co2PerYear',
      'costCurrency', 'savingsCurrency', 'paybackStatus',
      'annualGeneration', 'selfConsumedKWh', 'exportedKWh', 'importedKWh',
      'costBreakdown', 'annualProjection',
    ]

    for (const [caseId, input] of Object.entries(CASES)) {
      const canonical = computeDesign(input)
      const expected = Object.fromEntries(outputKeys.map(key => [key, canonical[key]]))

      for (const consumer of DESIGN_CONSUMERS) {
        const actual = computeDesignForConsumer(consumer, input)
        expect(Object.fromEntries(outputKeys.map(key => [key, actual[key]])), `${caseId}/${consumer}`).toEqual(expected)
      }

      const savedReport = {
        design_inputs: input,
        daily_kwh: canonical.dailyKWh,
        system_kw: canonical.systemKW,
        panel_count: canonical.panels,
        inverter_kw: canonical.inverterKW,
        battery_kwh: canonical.batteryKWh,
        system_cost: canonical.systemCost,
        annual_savings: canonical.annualSavings,
        lifetime_savings: canonical.lifetimeSavings,
        payback_years: canonical.payback,
        co2_tonnes: canonical.co2PerYear,
        assumptions_version: canonical.assumptionsVersion,
      }
      const reportDesign = getReportDesign(savedReport, 'dashboard')
      expect(Object.fromEntries(outputKeys.map(key => [key, reportDesign[key]]))).toEqual(
        Object.fromEntries(outputKeys.map(key => [key, canonical[key]])),
      )
      const legacyDesign = getReportDesign({ ...savedReport, design_inputs: null }, 'dashboard')
      expect(legacyDesign.systemKW).toBe(canonical.systemKW)
      expect(legacyDesign.payback).toBe(canonical.payback)
      expect(legacyDesign.reportSource).toBe('legacy_snapshot')
      const staleDesign = getReportDesign({ ...savedReport, assumptions_version: 'older-version' }, 'dashboard')
      expect(staleDesign.reportSource).toBe('assumptions_version_mismatch')
    }
  })

  it('returns a deeply frozen design with a semantic assumptions version', () => {
    const design = computeDesign(CASES.A)
    expect(Object.isFrozen(design)).toBe(true)
    expect(Object.isFrozen(design.assumptions)).toBe(true)
    expect(Object.isFrozen(design.costBreakdown)).toBe(true)
    expect(Object.isFrozen(design.annualProjection)).toBe(true)
    expect(Object.isFrozen(design.annualProjection[0])).toBe(true)
    expect(design.assumptionsVersion).toBe('2026.11-v1')
  })

  it('keeps reference outputs finite and non-negative, and grid-tied storage at zero', () => {
    for (const input of Object.values(CASES)) {
      const design = computeDesign(input)
      for (const key of [
        'dailyKWh', 'systemKW', 'panels', 'inverterKW', 'batteryKWh',
        'systemCost', 'annualSavings', 'co2PerYear', 'annualGeneration',
      ]) {
        expect(Number.isFinite(design[key])).toBe(true)
        expect(design[key]).toBeGreaterThanOrEqual(0)
      }
      if (input.systemType === 'Grid-tied only') {
        expect(design.batteryKWh).toBe(0)
        expect(design.costBreakdown.battery).toBe(0)
      }
    }
  })
})
