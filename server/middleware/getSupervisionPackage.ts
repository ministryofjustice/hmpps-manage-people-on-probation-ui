import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { DateTime } from 'luxon'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { SupervisionPackageResponse } from '../models/SupervisionPackage'
import { isFinalThirdEligibilityInWindow } from '../utils/finalThird'

export const getSupervisionPackage = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
  { includeAppointmentsFlag = false }: { includeAppointmentsFlag?: boolean } = {},
): Route<Promise<void>> => {
  const fetchSupervisionPackage = async (
    crn: string,
    token: string,
  ): Promise<{
    supervisionPackageData: SupervisionPackageResponse
    supervisionPackageDataIsLoading: boolean
    supervisionPackageDataError: Error | undefined
  }> => {
    let supervisionPackageData: SupervisionPackageResponse = null
    let supervisionPackageDataIsLoading: boolean = false
    let supervisionPackageDataError: Error | undefined

    try {
      supervisionPackageDataIsLoading = true
      supervisionPackageData = await mpopComponents.getSupervisionPackageFrontendContext(token, crn)
      if (!supervisionPackageData) {
        supervisionPackageDataError = new Error(`Failed to fetch supervision package for CRN ${crn}`)
        logger.error(supervisionPackageDataError, 'Failed to fetch supervision package from MPoP Components API.')
      }
    } catch (err) {
      supervisionPackageDataError =
        typeof err === 'object' && err !== null && 'message' in err
          ? new Error(String((err as any).message))
          : new Error(`Failed to fetch supervision package for CRN ${crn}`)
      logger.error(supervisionPackageDataError, 'Failed to connect to MPoP Components API.')
    } finally {
      supervisionPackageDataIsLoading = false
    }
    return {
      supervisionPackageData,
      supervisionPackageDataIsLoading,
      supervisionPackageDataError,
    }
  }

  return async function getSupervisionPackageInner(req, res, next) {
    // Skip if an earlier mount of this middleware on the same request (e.g. case.ts's catch-all) already fetched it
    if (res.locals.supervisionPackageAttempted || res.locals.supervisionPackageDetails) return next()

    // enableSupervisionPackageAppointments only applies to routes mounted with includeAppointmentsFlag,
    // so it doesn't trigger a fetch on every case page when only the appointments rollout flag is on
    const appointmentsFlagActive = includeAppointmentsFlag && res.locals.flags?.enableSupervisionPackageAppointments
    if (!res.locals.flags?.enableSupervisionPackage && !appointmentsFlagActive) return next()

    res.locals.supervisionPackageAttempted = true

    const { crn } = req.params as Record<string, string>

    const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
    const { supervisionPackageData } = await fetchSupervisionPackage(crn, token)

    if (supervisionPackageData) {
      res.locals.supervisionPackageDetails = supervisionPackageData
      if (supervisionPackageData.context?.finalThirdEligibility) {
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
