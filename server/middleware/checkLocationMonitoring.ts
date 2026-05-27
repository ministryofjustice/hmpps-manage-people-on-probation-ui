import { LicenceCondition, Requirement } from '../data/model/sentenceDetails'

export const checkLocationMonitoring = (
  licenceConditions: LicenceCondition[],
  requirements: Requirement[],
): {
  hasLicenceConditionsLMData?: boolean
  hasRequirementsLMData?: boolean
} => {
  const hasLicenceConditionsLMData = (licenceConditions || []).some(item =>
    item.mainDescription?.toLowerCase().includes('location monitoring'),
  )
  const hasRequirementsLMData = (requirements || []).some(item =>
    item.description?.toLowerCase().includes('location monitoring'),
  )

  return { hasLicenceConditionsLMData, hasRequirementsLMData }
}

export const checkLocationMonitoringString = (description: string): boolean =>
  description?.toLowerCase().includes('location monitoring')
