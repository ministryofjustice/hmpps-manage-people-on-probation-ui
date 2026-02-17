import { RiskToSelf } from '../data/model/risk'
import { getCurrentRisksToThemselves } from './getCurrentRisksToThemselves'
import { getRisksToThemselves } from './getRisksToThemselves'

export const getPreviousRisksToThemselves = (riskToSelf: RiskToSelf): string[] => {
  const currentRisks = getCurrentRisksToThemselves(riskToSelf)
  const previousRisks = getRisksToThemselves(riskToSelf, 'previous')
  return previousRisks.filter(risk => !currentRisks.includes(risk))
}
