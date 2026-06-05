import { LicenceCondition, Requirement, Sentence } from '../data/model/sentenceDetails'

export const LICENCE_GPS_TAGGING_CODE: string = 'EM01'
export const REQUIREMENT_GPS_TAGGING_CODE: string = 'RM59'
const GPS_TAGGING_CODES: string[] = [LICENCE_GPS_TAGGING_CODE, REQUIREMENT_GPS_TAGGING_CODE]

export const checkLocationMonitoring = (
  licenceConditions: LicenceCondition[] | null | undefined,
  requirements: Requirement[] | null | undefined,
): {
  hasLicenceConditionsLMData: boolean
  hasRequirementsLMData: boolean
} => {
  const hasLicenceConditionsLMData = (licenceConditions || []).some(item => item.code === LICENCE_GPS_TAGGING_CODE)
  const hasRequirementsLMData = (requirements || []).some(item => item.code === REQUIREMENT_GPS_TAGGING_CODE)

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

export const checkLocationMonitoringCode = (code: string | null | undefined): boolean =>
  !!code && GPS_TAGGING_CODES.includes(code)
