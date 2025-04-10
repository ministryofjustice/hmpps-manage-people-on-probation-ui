import { RiskToSelf } from '../data/arnsApiClient'
import { getRisksToThemselves } from './getRisksToThemselves'

export const getCurrentRisksToThemselves = (riskToSelf: RiskToSelf): string[] => {
  return getRisksToThemselves(riskToSelf, 'current')
}
