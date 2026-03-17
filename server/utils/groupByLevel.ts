import { Need, RiskFlag } from '../data/model/risk'
import { isRisk } from './isRisk'

export const groupByLevel = (level: string | undefined, data: Need[] | RiskFlag[]) => {
  if (!data) {
    return []
  }
  console.log(data)
  console.log(level)
  const targetLevel = level?.toLowerCase()
  if (isRisk(data)) {
    console.log(data.filter(item => item?.severity === level))
    return data.filter(item => item?.severity === level)
  }
  console.log(
    data.filter(item =>
      item?.levelDescription
        ? item.levelDescription.toLowerCase() === targetLevel
        : item.level?.toLowerCase() === targetLevel,
    ),
  )
  return data.filter(item =>
    item?.levelDescription
      ? item.levelDescription.toLowerCase() === targetLevel
      : item.level?.toLowerCase() === targetLevel,
  )
}
