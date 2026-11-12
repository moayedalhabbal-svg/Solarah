import { formatPayback } from './calculator.js'

const DESIGN_FIELDS = [
  'systemKW',
  'panels',
  'inverterKW',
  'batteryKWh',
  'systemCost',
  'annualSavings',
  'payback',
  'co2PerYear',
  'dailyKWh',
  'annualGeneration',
  'selfConsumedKWh',
  'exportedKWh',
  'importedKWh',
  'lifetimeSavings',
]

export function getAiDesignFacts(design) {
  return Object.fromEntries(DESIGN_FIELDS.map(field => [field, design[field] ?? null]))
}

function parseNumericToken(token) {
  const normalized = token
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٬,]/g, '')
    .replace('٫', '.')
  return Number(normalized)
}

export function hasOnlyDesignNumbers(text, designFacts) {
  const numbers = text.match(/[0-9٠-٩۰-۹]+(?:[.,٬٫][0-9٠-٩۰-۹]+)*/g) || []
  const allowed = Object.values(designFacts).filter(Number.isFinite)
  if (designFacts.payback === null) allowed.push(25)

  return numbers.every(token => {
    const value = parseNumericToken(token)
    const precision = (token.split(/[.,٬٫]/)[1] || '').length
    return allowed.some(expected => {
      const rounded = Math.round(expected * (10 ** precision)) / (10 ** precision)
      return Math.abs(value - rounded) < 1e-8
    })
  })
}

export function buildSafeDesignSummary(designFacts) {
  return [
    `The computed design is ${designFacts.systemKW} kWp with ${designFacts.panels} panels, a ${designFacts.inverterKW} kW inverter, and ${designFacts.batteryKWh} kWh of battery storage.`,
    `Estimated system cost is USD ${Number(designFacts.systemCost).toLocaleString()}, with annual savings of USD ${Number(designFacts.annualSavings).toLocaleString()} and payback ${formatPayback(designFacts.payback)}.`,
    `The model estimates ${designFacts.annualGeneration} kWh generated annually, including ${designFacts.selfConsumedKWh} kWh self-consumed, ${designFacts.exportedKWh} kWh exported, and ${designFacts.importedKWh} kWh imported. Estimated CO2 reduction is ${designFacts.co2PerYear} tonnes per year.`,
  ].join('\n\n')
}
