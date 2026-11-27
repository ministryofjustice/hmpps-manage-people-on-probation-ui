import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { DateTime } from 'luxon'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { isFinalThirdEligibilityInWindow } from '../utils/finalThird'

export const getSupervisionPackage = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  return async function getSupervisionPackageInner(req, res, next) {
    // Skip if an earlier mount of this middleware on the same request (e.g. case.ts's catch-all) already fetched it
    if (res.locals.supervisionPackageAttempted || res.locals.supervisionPackageDetails) return next()

    res.locals.supervisionPackageAttempted = true

    const { crn } = req.params as Record<string, string>

    const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
    const { supervisionPackage: supervisionPackageData, unavailable } =
      await mpopComponents.getSupervisionPackageContext(token, crn)
    res.locals.supervisionPackageUnavailable = unavailable

    if (supervisionPackageData) {
      res.locals.supervisionPackageDetails = supervisionPackageData
      if (supervisionPackageData.outcome === 'success' && supervisionPackageData.context?.finalThirdEligibility) {
        const finalThirdEligibility = supervisionPackageData.context?.finalThirdEligibility
        if (
          finalThirdEligibility?.since &&
          isFinalThirdEligibilityInWindow(finalThirdEligibility.since, DateTime.now())
        ) {
          res.locals.finalThirdPrompt = { eligible: finalThirdEligibility.eligible }
        }
      }
    }

    return next()
  }
}
