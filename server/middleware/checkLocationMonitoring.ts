import { LicenceCondition, Requirement, Sentence } from '../data/model/sentenceDetails'

export const checkLocationMonitoring = (
  licenceConditions: LicenceCondition[] | null | undefined,
  requirements: Requirement[] | null | undefined,
): {
  hasLicenceConditionsLMData: boolean
  hasRequirementsLMData: boolean
} => {
  const hasLicenceConditionsLMData = (licenceConditions || []).some(item =>
    item.mainDescription?.toLowerCase().includes('location monitoring'),
  )
  const hasRequirementsLMData = (requirements || []).some(item =>
    item.description?.toLowerCase().includes('location monitoring'),
  )

  return { hasLicenceConditionsLMData, hasRequirementsLMData }
}

export const checkLocationMonitoringByEventNumber = (
  eventNumber: string,
  sentences: Sentence[],
): {
  hasLicenceConditionsLMData: boolean
  hasRequirementsLMData: boolean
} => {
  const sentenceByEventNumber = sentences?.find(f => f.eventNumber === eventNumber)
  return checkLocationMonitoring(sentenceByEventNumber?.licenceConditions, sentenceByEventNumber?.requirements)
}

export const hasLocationMonitoring = (
  licenceConditions: LicenceCondition[] | null | undefined,
  requirements: Requirement[] | null | undefined,
): boolean => {
  const hasLicenceConditionsLMData = (licenceConditions || []).some(item =>
    item.mainDescription?.toLowerCase().includes('location monitoring'),
  )
  const hasRequirementsLMData = (requirements || []).some(item =>
    item.description?.toLowerCase().includes('location monitoring'),
  )

  return hasLicenceConditionsLMData || hasRequirementsLMData
}

export const checkLocationMonitoringString = (description: string | null | undefined): boolean | undefined =>
  description?.toLowerCase().includes('location monitoring')
