import { RiskFlag } from '../data/model/risk'

export const getStaffRisk = (data: RiskFlag[]): RiskFlag => {
  if (!data) {
    return null
  }
  const staffFlag = data.filter(
    item =>
      item?.description === 'Risk to Staff' &&
      (!item.levelDescription || ['medium', 'high', 'very high'].includes(item.levelDescription.toLowerCase())),
  )

  if (staffFlag.length === 0) {
    return null
  }

  return staffFlag[0]
}
