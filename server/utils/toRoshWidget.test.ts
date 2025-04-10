import { RiskSummary } from '../data/arnsApiClient'
import { toRoshWidget } from './toRoshWidget'
import { roshSummary } from './mocks'

describe('utils/toRoshWidget', () => {
  it('should return if rosh is undefined', () => {
    expect(toRoshWidget(undefined)).toStrictEqual({
      overallRisk: 'NOT_FOUND',
      assessedOn: undefined,
      risks: undefined,
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
      risks: undefined,
    })
  })
  it('should return the rosh widget if no summary risk in community or risk in custody', () => {
    const mockRosh = {
      ...roshSummary,
      summary: {
        ...roshSummary.summary,
        riskInCommunity: null,
        riskInCustody: null,
      },
    } as RiskSummary
    expect(toRoshWidget(mockRosh)).toStrictEqual({
      overallRisk: roshSummary.summary.overallRiskLevel,
      assessedOn: roshSummary.assessedOn,
      risks: [],
    })
  })
  it('should return the rosh widget if risk in community and risk in custody do not contain same values', () => {
    const mockRosh = {
      ...roshSummary,
      summary: {
        ...roshSummary.summary,
        riskInCommunity: {
          LOW: ['Children', 'Staff'],
          HIGH: ['Public'],
          VERY_HIGH: ['Prisoners'],
        },
        riskInCustody: {
          LOW: ['Children', 'Public', 'Known Adult', 'Staff'],
        },
      },
    } as RiskSummary
    const expected = [
      { riskTo: 'Children', community: 'LOW', custody: 'LOW' },
      { riskTo: 'Staff', community: 'LOW', custody: 'LOW' },
      { riskTo: 'Public', community: 'HIGH', custody: 'LOW' },
      { riskTo: 'Prisoners', community: 'VERY_HIGH', custody: 'N/A' },
      { riskTo: 'Known Adult', community: 'N/A', custody: 'LOW' },
    ]
    expect(toRoshWidget(mockRosh)).toEqual({
      overallRisk: roshSummary.summary.overallRiskLevel,
      assessedOn: roshSummary.assessedOn,
      risks: expected,
    })
  })
  it('should return if rosh summary is available', () => {
    const expected = [
      { riskTo: 'Children', community: 'LOW', custody: 'LOW' },
      { riskTo: 'Staff', community: 'LOW', custody: 'LOW' },
      { riskTo: 'Known Adult', community: 'MEDIUM', custody: 'LOW' },
      { riskTo: 'Public', community: 'HIGH', custody: 'LOW' },
      { riskTo: 'Prisoners', community: 'VERY_HIGH', custody: 'LOW' },
    ]
    expect(toRoshWidget(roshSummary)).toStrictEqual({
      overallRisk: roshSummary.summary.overallRiskLevel,
      assessedOn: roshSummary.assessedOn,
      risks: expected,
    })
  })
})
