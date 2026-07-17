import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { SupervisionPackageResponse } from '../models/SupervisionPackage'

export const getSupervisionPackage = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  const fetchSupervisionPackage = async (
    crn: string,
    token: string,
  ): Promise<{
    supervisionPackageData: SupervisionPackageResponse
    supervisionPackageDataIsLoading: boolean
    supervisionPackageDataError: Error | undefined
  }> => {
    let supervisionPackageData: SupervisionPackageResponse = { supervisionPackage: null, httpStatus: 500 }
    let supervisionPackageDataIsLoading: boolean = false
    let supervisionPackageDataError: Error | undefined

    try {
      supervisionPackageDataIsLoading = true
      supervisionPackageData = await mpopComponents.getSupervisionPackage(token, crn)
      if (supervisionPackageData?.httpStatus !== 200) {
        supervisionPackageDataError = new Error(
          `Failed to fetch supervision package for CRN ${crn}. HTTP status: ${supervisionPackageData?.httpStatus}`,
        )
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

  return async (req, res, next) => {
    // If the feature flag is not enabled, skip fetching supervision package and proceed to the next middleware
    if (!res.locals.flags?.enableSupervisionPackage) return next()

    const { crn } = req.params as Record<string, string>
    let supervisionPackageResponse: SupervisionPackageResponse | undefined

    req.session.data.personalDetails ??= {}
    req.session.data.personalDetails[crn] ??= {} as any
    if (process.env.NODE_ENV === 'development') {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
      const { supervisionPackageData, supervisionPackageDataIsLoading } = await fetchSupervisionPackage(crn, token)
      supervisionPackageResponse = !supervisionPackageDataIsLoading ? supervisionPackageData : undefined
      req.session.data.personalDetails[crn].supervisionPackageResponse = supervisionPackageResponse
    } else {
      ;({ supervisionPackageResponse } = req.session.data.personalDetails[crn])
      if (!supervisionPackageResponse) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
        const { supervisionPackageData, supervisionPackageDataIsLoading } = await fetchSupervisionPackage(crn, token)
        supervisionPackageResponse = !supervisionPackageDataIsLoading ? supervisionPackageData : undefined
        req.session.data.personalDetails[crn].supervisionPackageResponse = supervisionPackageResponse
      }
    }

    if (supervisionPackageResponse?.httpStatus === 200) {
      console.dir(supervisionPackageResponse.supervisionPackage, { depth: null })
      res.locals.supervisionPackageDetails = supervisionPackageResponse.supervisionPackage
    }

    return next()
  }
}
