import { describe, expect, it } from 'vitest'
import { estimateAffiliateMetrics } from '../affiliateEstimates.js'

describe('affiliate revenue estimate', () => {
  it('uses the same explicitly unverified assumptions in admin views', () => {
    expect(estimateAffiliateMetrics(100)).toEqual({
      conversions: 2,
      revenueUsd: 48,
    })
  })
})
