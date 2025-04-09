import { RiskSummary } from '../data/arnsApiClient'
import { RoshRiskWidgetDto } from '../data/model/risk'
import { toMap } from './toMap'

export const toRoshWidget = (roshSummary: RiskSummary): RoshRiskWidgetDto => {
  if (!roshSummary) {
    return {
      overallRisk: 'NOT_FOUND',
      assessedOn: undefined,
      riskInCommunity: undefined,
      riskInCustody: undefined,
    } as unknown as RoshRiskWidgetDto
  }
  if (!roshSummary.summary) {
    return {
      overallRisk: 'UNAVAILABLE',
      assessedOn: undefined,
      riskInCommunity: undefined,
      riskInCustody: undefined,
    } as unknown as RoshRiskWidgetDto
  }
  const riskInCommunity = toMap(roshSummary.summary.riskInCommunity)
  const riskInCustody = toMap(roshSummary.summary.riskInCustody)
  return {
    overallRisk: roshSummary.summary.overallRiskLevel,
    assessedOn: roshSummary.assessedOn,
    riskInCommunity,
    riskInCustody,
  } as unknown as RoshRiskWidgetDto
}
