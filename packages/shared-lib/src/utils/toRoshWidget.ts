import { RiskSummary, RoshRiskWidgetDto } from '../data/model/risk'
import { toMap } from './toMap'

export const toRoshWidget = (roshSummary: RiskSummary): RoshRiskWidgetDto => {
  if (!roshSummary) {
    return {
      overallRisk: 'NOT_FOUND',
      assessedOn: undefined,
      risks: undefined,
    }
  }

  if (!roshSummary.summary) {
    return { overallRisk: 'UNAVAILABLE', assessedOn: undefined, risks: undefined }
  }

  const riskInCommunity = roshSummary.summary?.riskInCommunity ? toMap(roshSummary.summary.riskInCommunity) : {}
  const riskInCustody = roshSummary.summary?.riskInCustody ? toMap(roshSummary.summary.riskInCustody) : {}

  const risks = Array.from(new Set([...Object.keys(riskInCommunity), ...Object.keys(riskInCustody)])).map(key => {
    return {
      riskTo: key,
      community: riskInCommunity[key] || 'N/A',
      custody: riskInCustody[key] || 'N/A',
    }
  })

  return {
    overallRisk: roshSummary.summary.overallRiskLevel,
    assessedOn: roshSummary.assessedOn,
    risks,
  }
}
