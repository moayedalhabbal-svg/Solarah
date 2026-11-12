// UNVERIFIED business assumptions; this estimate is not measured revenue.
export const AFFILIATE_ESTIMATE_ASSUMPTIONS = Object.freeze({
  conversionRate: 0.02,
  averageOrderValueUsd: 800,
  commissionRate: 0.03,
})

export function estimateAffiliateMetrics(clicks) {
  const conversions = Math.round(clicks * AFFILIATE_ESTIMATE_ASSUMPTIONS.conversionRate)
  const revenueUsd = conversions
    * AFFILIATE_ESTIMATE_ASSUMPTIONS.averageOrderValueUsd
    * AFFILIATE_ESTIMATE_ASSUMPTIONS.commissionRate
  return { conversions, revenueUsd }
}
