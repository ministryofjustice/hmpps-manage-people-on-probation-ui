import ESupervisionClient from '../data/eSupervisionClient'
import { OffenderCheckinsByCRNResponse, OffenderEligibility } from '../data/model/esupervision'
import { AppResponse } from '../models/Locals'
import { eligibilityCheckDisabled, resolveCheckinEligibility } from './checkinEligibility'
import { fullName } from './fullName'

export interface CheckinEligibilityDetails {
  offenderCheckinsByCRNResponse: OffenderCheckinsByCRNResponse
  checkinEligibility: OffenderEligibility | null
}

export const getCheckinEligibility = async (
  token: string,
  crn: string,
  {
    flags,
    tierCalculation,
    headerPersonName,
  }: Pick<AppResponse['locals'], 'flags' | 'tierCalculation' | 'headerPersonName'>,
): Promise<CheckinEligibilityDetails> => {
  const isEligibilityCheckEnabled = flags?.enableEsupEligibilityCheck === true
  const eSupervisionClient = new ESupervisionClient(token)
  const [offenderCheckinsByCRNResponse, offenderEligibility] = await Promise.all([
    eSupervisionClient.getOffenderCheckinsByCRN(crn),
    isEligibilityCheckEnabled ? eSupervisionClient.getOffenderEligibility(crn) : undefined,
  ])
  const checkinEligibility = isEligibilityCheckEnabled
    ? resolveCheckinEligibility(
        offenderEligibility,
        tierCalculation,
        fullName(headerPersonName),
        offenderCheckinsByCRNResponse?.status,
      )
    : eligibilityCheckDisabled
  return { offenderCheckinsByCRNResponse, checkinEligibility }
}
