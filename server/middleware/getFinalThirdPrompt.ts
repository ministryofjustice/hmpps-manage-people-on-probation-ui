import { DateTime } from 'luxon'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import SupervisionPackageApiClient from '../data/supervisionPackageApiClient'
import { isFinalThirdEligibilityInWindow } from '../utils/finalThird'

export const getFinalThirdPrompt = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getFinalThirdPromptInner(req, res, next) {
    if (!res.locals.flags?.enableFinalThirdPrompt) return next()

    const { crn } = req.params as Record<string, string>

    try {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
      const currentPhase = await new SupervisionPackageApiClient(token).getCurrentPhase(crn)
      const { finalThirdEligibility } = currentPhase ?? {}

      if (
        finalThirdEligibility?.since &&
        isFinalThirdEligibilityInWindow(finalThirdEligibility.since, DateTime.now())
      ) {
        res.locals.finalThirdPrompt = { eligible: finalThirdEligibility.eligible }
      }
    } catch (err) {
      logger.error(err, `Failed to fetch current phase for CRN ${crn}.`)
    }

    return next()
  }
}
