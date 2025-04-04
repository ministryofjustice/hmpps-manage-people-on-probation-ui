import { RiskScore } from '../data/arnsApiClient'
import { getTagClass } from './getTagClass'

describe('utils/getTagClass', () => {
  const HIGH: RiskScore = 'HIGH'
  const LOW: RiskScore = 'LOW'
  const MEDIUM: RiskScore = 'MEDIUM'
  const VERY_HIGH: RiskScore = 'VERY_HIGH'
  it.each([
    [null, null, 'govuk-tag--blue'],
    ['Low', LOW, 'govuk-tag--green'],
    ['Medium', MEDIUM, 'govuk-tag--yellow'],
    ['High', HIGH, 'govuk-tag--red'],
    ['Very High', VERY_HIGH, 'govuk-tag--red'],
  ])('%s getTagClass(%s, %s)', (_: string, a: RiskScore, expected: string) => {
    expect(getTagClass(a)).toEqual(expected)
  })
})
