import { riskLevelLabel } from './riskLevelLabel'

describe('utils/riskLevelLabel', () => {
  it.each([
    ['VERY_HIGH', 'Very high'],
    ['HIGH', 'High'],
    ['MEDIUM', 'Medium'],
    ['LOW', 'Low'],
    ['NO_MATCH', 'NO_MATCH'],
  ])(`It argument is %s it should return '%s'`, (a: string, expected: string) => {
    expect(riskLevelLabel(a)).toEqual(expected)
  })
})
