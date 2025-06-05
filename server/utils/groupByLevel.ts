import { Need } from '../data/arnsApiClient'
import { RiskFlag } from '../data/model/risk'
import { isRisk } from './isRisk'

export const groupByLevel = (level: string, data: Need[] | RiskFlag[]) => {
  if (!data) {
    return []
  }
  if (isRisk(data)) {
    return data.filter(item => item?.severity === level)
  }
  return data.filter(item => item.level === level)
}
