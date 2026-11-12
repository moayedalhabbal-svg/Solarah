import { describe, expect, it } from 'vitest'
import { buildSafeDesignSummary, getAiDesignFacts, hasOnlyDesignNumbers } from '../aiDesignContext.js'

const DESIGN = {
  systemKW: 5.2,
  panels: 13,
  inverterKW: 6.24,
  batteryKWh: 8,
  systemCost: 6240,
  annualSavings: 1050,
  payback: 5.9,
  co2PerYear: 1.7,
  dailyKWh: 21,
  annualGeneration: 6800,
  selfConsumedKWh: 4000,
  exportedKWh: 2800,
  importedKWh: 3665,
  lifetimeSavings: 26250,
}

describe('AI design-number guard', () => {
  it('accepts computed values including values rounded to the displayed precision', () => {
    const facts = getAiDesignFacts(DESIGN)
    expect(hasOnlyDesignNumbers('5 kWp, 13 panels, 6.2 kW inverter, USD 6,240 and 5.9 years.', facts)).toBe(true)
    expect(hasOnlyDesignNumbers('سعة ٨ كيلوواط ساعة و١٣ لوحًا.', facts)).toBe(true)
  })

  it('rejects figures absent from the computed design', () => {
    expect(hasOnlyDesignNumbers('The 5.2 kWp system will save USD 2,400 per year.', getAiDesignFacts(DESIGN))).toBe(false)
    expect(hasOnlyDesignNumbers('A solar system lasts 30 years.', {})).toBe(false)
  })

  it('creates a deterministic fallback from computed values', () => {
    const facts = getAiDesignFacts(DESIGN)
    const summary = buildSafeDesignSummary(facts)
    expect(summary).toContain('5.2 kWp')
    expect(summary).toContain('USD 6,240')
    expect(summary).toContain('USD 1,050')
    expect(summary).toContain('1.7 tonnes')
  })
})
