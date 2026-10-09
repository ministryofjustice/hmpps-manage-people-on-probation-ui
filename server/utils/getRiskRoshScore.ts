import { RiskFlag, RoshBadgeLevel } from '../data/model/risk'

export const getRiskRoshScore = (riskFlags: RiskFlag[]): RoshBadgeLevel | null => {
  if (!riskFlags?.length) {
    return null
  }
  const riskRoshScore = riskFlags
    ?.filter(riskFlag => !riskFlag.removed)
    ?.find(riskFlag => riskFlag?.description?.toLowerCase()?.includes('rosh'))
  if (riskRoshScore) {
    return riskRoshScore.description.toLowerCase().replace('rosh', '').trim().toUpperCase() as RoshBadgeLevel
  }
  return null
}
