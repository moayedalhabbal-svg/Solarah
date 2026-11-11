import { ASSUMPTIONS_VERSION, computeDesign } from './calculator.js'

export const DESIGN_CONSUMERS = Object.freeze([
  'calculator',
  'beginner-results',
  'system-design',
  'system-diagram',
  'system-assembly',
  'installation-steps',
  'solar-yield-chart',
  'expert-pdf',
  'beginner-pdf',
  'dashboard',
  'admin-overview',
  'admin-report',
  'admin-user-report',
])

export function computeDesignForConsumer(consumer, state) {
  if (!DESIGN_CONSUMERS.includes(consumer)) {
    throw new RangeError(`Unknown design consumer: ${consumer}`)
  }
  return computeDesign(state)
}

export function getReportDesign(report, consumer) {
  if (report.design_inputs && report.assumptions_version === ASSUMPTIONS_VERSION) {
    return {
      ...computeDesignForConsumer(consumer, report.design_inputs),
      reportSource: 'recomputed',
    }
  }

  return {
    dailyKWh: report.daily_kwh,
    systemKW: report.system_kw,
    panels: report.panel_count,
    inverterKW: report.inverter_kw,
    batteryKWh: report.battery_kwh,
    systemCost: report.system_cost,
    annualSavings: report.annual_savings,
    lifetimeSavings: report.lifetime_savings,
    payback: report.payback_years,
    paybackStatus: 'legacy_snapshot',
    co2PerYear: report.co2_tonnes,
    costCurrency: 'USD',
    savingsCurrency: report.currency || 'USD',
    reportSource: report.design_inputs ? 'assumptions_version_mismatch' : 'legacy_snapshot',
  }
}
