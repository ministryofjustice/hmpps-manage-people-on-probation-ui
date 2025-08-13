import { RiskFlag } from '../data/model/risk'
import logger from '../../logger'

export const getStaffRisk = (data: RiskFlag[]): RiskFlag => {
  if (!data) {
    return null
  }
  const staffFlag = data.filter(item => item?.description === 'Risk to Staff')
  if (staffFlag.length === 0) {
    return null
  }
  if (staffFlag.length >= 2) {
    logger.error("Multiple 'Risk to Staff' flags exist for this single case")
    return null
  }

  return staffFlag[0]
}
