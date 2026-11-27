import { OffenderEligibility, OffenderStatus } from '../data/model/esupervision'
import { ErrorSummary } from '../data/model/common'
import { TierCalculation } from '../data/tierApiClient'

const MISSING = 'MISSING'
const TIER_BASED_MESSAGE = /\bin tiers?\b/i

export const noTierEligibilityMessage = (name: string): string =>
  `${name} is not eligible for online check ins because they have not been assigned a tier yet.`

export const mayBeEligibleMessage = (name: string): string => `${name} may be eligible for online check ins.`

// Used when the enableEsupEligibilityCheck flag is off so the eligibility check never blocks a journey
export const eligibilityCheckDisabled: OffenderEligibility = { outcome: 'ELIGIBLE', message: null }

export const isTierMissing = (tierCalculation?: TierCalculation | ErrorSummary | null): boolean => {
  if (!tierCalculation) return true
  if ('errors' in tierCalculation) return false
  return !tierCalculation.tierScore || tierCalculation.tierScore === MISSING || tierCalculation.data?.tier === MISSING
}

export const isTierBasedEligibility = (eligibility?: OffenderEligibility | null): boolean =>
  eligibility?.outcome === 'ELIGIBLE' && TIER_BASED_MESSAGE.test(eligibility.message?.trim() ?? '')

// People already set up for online check ins (whether active or stopped) must not be blocked by a missing tier
export const isRegisteredForCheckins = (checkinStatus?: OffenderStatus | null): boolean =>
  checkinStatus === 'VERIFIED' || checkinStatus === 'INACTIVE'

export const resolveCheckinEligibility = (
  eligibility: OffenderEligibility | null,
  tierCalculation: TierCalculation | ErrorSummary | null | undefined,
  name: string,
  checkinStatus?: OffenderStatus | null,
): OffenderEligibility | null => {
  if (isTierMissing(tierCalculation) && !isRegisteredForCheckins(checkinStatus)) {
    return { outcome: 'INELIGIBLE', message: noTierEligibilityMessage(name) }
  }
  // A tier on its own doesn't make someone eligible, so treat it like the API's UNKNOWN: a maybe
  if (isTierBasedEligibility(eligibility)) {
    return { ...eligibility, outcome: 'UNKNOWN', message: mayBeEligibleMessage(name) }
  }
  return eligibility
}
