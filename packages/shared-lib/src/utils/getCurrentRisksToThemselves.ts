import { RiskToSelf } from '../data/model/risk'
import { getRisksToThemselves } from './getRisksToThemselves'

export const getCurrentRisksToThemselves = (riskToSelf: RiskToSelf): string[] => {
  return getRisksToThemselves(riskToSelf, 'current')
}
