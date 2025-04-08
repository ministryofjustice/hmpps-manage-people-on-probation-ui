import { RiskSummary } from '../data/arnsApiClient'
import { toRoshWidget } from './toRoshWidget'
import { roshSummary } from './mocks'

describe('utils/toRoshWidget', () => {
  it('should return if rosh is undefined', () => {
    expect(toRoshWidget(undefined)).toStrictEqual({
      overallRisk: 'NOT_FOUND',
      assessedOn: undefined,
      riskInCommunity: undefined,
      riskInCustody: undefined,
    })
  })
  it('should return if no rosh summary is available', () => {
    const mockRosh = {
      ...roshSummary,
      summary: undefined,
    } as RiskSummary
    expect(toRoshWidget(mockRosh)).toStrictEqual({
      overallRisk: 'UNAVAILABLE',
      assessedOn: undefined,
      riskInCommunity: undefined,
      riskInCustody: undefined,
    })
  })
  it('should return if rosh summary is available', () => {
    expect(toRoshWidget(roshSummary)).toStrictEqual({
      overallRisk: roshSummary.summary.overallRiskLevel,
      assessedOn: roshSummary.assessedOn,
      riskInCommunity: {
        Children: 'LOW',
        Staff: 'LOW',
        'Known Adult': 'MEDIUM',
        Public: 'HIGH',
        Prisoners: 'VERY_HIGH',
      },
      riskInCustody: {
        Children: 'LOW',
        Public: 'LOW',
        'Known Adult': 'LOW',
        Staff: 'LOW',
        Prisoners: 'LOW',
      },
    })
  })
})
