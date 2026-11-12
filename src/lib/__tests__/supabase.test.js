import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockState } = vi.hoisted(() => ({
  mockState: { insertCalls: [], responses: [] },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from(table) {
      const builder = {
        insert(payload) {
          mockState.insertCalls.push({ table, payload })
          return builder
        },
        select() {
          return builder
        },
        eq() {
          return builder
        },
        then(resolve, reject) {
          return Promise.resolve(mockState.responses.shift() || { data: null, error: null })
            .then(resolve, reject)
        },
      }
      return builder
    },
  }),
}))

import { saveReport } from '../supabase.js'

describe('saveReport migration compatibility', () => {
  beforeEach(() => {
    mockState.insertCalls.length = 0
    mockState.responses.length = 0
  })

  it('retries with legacy columns when design columns are missing', async () => {
    const schemaError = {
      code: 'PGRST204',
      message: "Could not find the 'design_inputs' column of 'reports' in the schema cache",
    }
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockState.responses.push(
      { data: null, error: schemaError },
      { data: [{ id: 'report-1' }], error: null },
      { data: null, error: null, count: 2 },
    )

    const result = await saveReport('user-1', {
      region: 'Cairo',
      systemKW: 4.4,
      designInputs: { region: 'North Africa / Middle East' },
      assumptionsVersion: '2026.11-v1',
    })

    expect(mockState.insertCalls).toHaveLength(2)
    expect(mockState.insertCalls[0].payload[0]).toHaveProperty('design_inputs')
    expect(mockState.insertCalls[1].payload[0]).not.toHaveProperty('design_inputs')
    expect(mockState.insertCalls[1].payload[0]).not.toHaveProperty('assumptions_version')
    expect(result).toEqual({ data: [{ id: 'report-1' }], error: null })
    expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('retrying save'), schemaError)
    consoleWarn.mockRestore()
  })

  it('does not retry unrelated database errors and returns the failure', async () => {
    const databaseError = { code: '42501', message: 'row-level security violation' }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockState.responses.push({ data: null, error: databaseError })

    const result = await saveReport('user-1', { region: 'Cairo' })

    expect(mockState.insertCalls).toHaveLength(1)
    expect(result.error).toBe(databaseError)
    expect(consoleError).toHaveBeenCalledWith('Report save failed:', databaseError)
    consoleError.mockRestore()
  })
})
