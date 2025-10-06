import { Need, RiskFlag } from '../data/model/risk'
import { isRisk } from './isRisk'

export const groupByLevel = (level: string, data: Need[] | RiskFlag[]) => {
  if (!data) {
    return []
  }
  const targetLevel = level.toLowerCase()
  if (isRisk(data)) {
    return data.filter(item => item?.severity === level)
  }
  return data.filter(item =>
    item?.levelDescription
      ? item.levelDescription.toLowerCase() === targetLevel
      : item.level.toLowerCase() === targetLevel,
  )
}
