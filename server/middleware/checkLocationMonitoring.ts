import { LicenceCondition, Requirement, Sentence } from '../data/model/sentenceDetails'

const GPS_TAGGING_CODES: string[] = ['RM59', 'EM01']

export const checkLocationMonitoring = (
  licenceConditions: LicenceCondition[] | null | undefined,
  requirements: Requirement[] | null | undefined,
): {
  hasLicenceConditionsLMData: boolean
  hasRequirementsLMData: boolean
} => {
  const hasLicenceConditionsLMData = (licenceConditions || []).some(item => item.code === 'EM01')
  const hasRequirementsLMData = (requirements || []).some(item => item.code === 'RM59')

  return { hasLicenceConditionsLMData, hasRequirementsLMData }
}

export const checkLocationMonitoringByEventNumber = (
  eventNumber: string,
  sentences: Sentence[] | null | undefined,
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
  const { hasLicenceConditionsLMData, hasRequirementsLMData } = checkLocationMonitoring(licenceConditions, requirements)
  return hasLicenceConditionsLMData || hasRequirementsLMData
}

export const checkLocationMonitoringCode = (code: string | null | undefined): boolean | undefined =>
  GPS_TAGGING_CODES.includes(code)
