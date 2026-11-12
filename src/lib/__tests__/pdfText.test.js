import { describe, expect, it } from 'vitest'
import { sanitizePdfText } from '../pdf.js'

describe('PDF text encoding', () => {
  it('uses ASCII-safe CO2 and symbols and omits unsupported scripts', () => {
    expect(sanitizePdfText('CO₂: 5 × 400W; 12 ÷ 3 — Arabic مرحبا'))
      .toBe('CO2: 5 x 400W; 12 / 3 - Arabic [non-English text omitted]')
    expect(sanitizePdfText('énergie')).toBe('energie')
    expect(sanitizePdfText('A • B · C')).toBe('A - B - C')
  })
})
