import { RiskFlag, RoshBadgeLevel } from '../data/model/risk'

export const getRiskRoshScore = (
  riskFlags: RiskFlag[],
): { score: RoshBadgeLevel | null; assessedOn: string | null } => {
  let score = null
  let assessedOn = null
  if (riskFlags?.length) {
    score =
      (riskFlags
        ?.filter(riskFlag => !riskFlag.removed)
        ?.find(riskFlag => riskFlag?.description?.toLowerCase()?.includes('rosh'))
        ?.description.toLowerCase()
        .replace('rosh', '')
        .trim()
        .toUpperCase() as RoshBadgeLevel) ?? null
    assessedOn =
      riskFlags?.filter(riskFlag => !riskFlag.removed).find(riskFlag => riskFlag?.mostRecentReviewDate)
        ?.mostRecentReviewDate ?? null
  }
  return { score, assessedOn }
}
