import { RiskScore } from '../data/arnsApiClient'
import { getRisksWithScore } from './getRisksWithScore'

describe('gets risks with score', () => {
  const array: string[] = ['Children', 'Staff']
  const risk: Partial<Record<RiskScore, string[]>> = { VERY_HIGH: array }
  it.each([
    ['Filters empty object', risk, 'VERY_HIGH', array],
    ['Filters empty object', risk, 'VERY_HIGH', array],
    ['Returns an empty array', risk, 'HIGH', []],
  ])(
    '%s getRisksWithScore(%s, %s)',
    (_: string, a: Partial<Record<RiskScore, string[]>>, b: RiskScore, expected: string[]) => {
      expect(getRisksWithScore(a, b)).toEqual(expected)
    },
  )
})
