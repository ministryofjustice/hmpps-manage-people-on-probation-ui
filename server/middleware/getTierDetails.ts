import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { LatestTierResponse } from '../data/tierApiClient'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { tierUrlV3 } from '../utils'

export const getTierDetails = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents?: MPoPComponents,
): Route<Promise<void>> => {
  const fetchTierDetails = async (
    crn: string,
    token: string,
  ): Promise<{
    tierData: LatestTierResponse
    tierDataIsLoading: boolean
    tierDataError: Error | undefined
  }> => {
    let tierData: LatestTierResponse
    let tierDataIsLoading: boolean = false
    let tierDataError: Error | undefined

    try {
      tierDataIsLoading = true
      tierData = await mpopComponents.getTierDetails(token, crn)
      if (tierData?.httpStatus !== 200) {
        tierDataError = new Error(`Failed to fetch tier details for CRN ${crn}. HTTP status: ${tierData?.httpStatus}`)
        logger.error(tierDataError, 'Failed to fetch tier details from MPoP Components API.')
      }
    } catch (err) {
      tierDataError =
        typeof err === 'object' && err !== null && 'message' in err ? new Error((err as any).message) : new Error('500')
      logger.error(tierDataError, 'Failed to connect to MPoP Components API.')
    } finally {
      tierDataIsLoading = false
    }
    return {
      tierData,
      tierDataIsLoading,
      tierDataError,
    }
  }

  return async (req, res, next) => {
    if (!res.locals.flags.enableSupervisionPackage || !mpopComponents) {
      return next()
    }

    const token: string | undefined = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
    const { crn } = req.params as Record<string, string>
    let tierDetails: LatestTierResponse | undefined

    if (!req?.session?.data?.personalDetails?.[crn] || process.env.NODE_ENV === 'development') {
      const { tierData, tierDataIsLoading } = await fetchTierDetails(crn, token)

      tierDetails = !tierDataIsLoading ? tierData : undefined
      req.session.data.personalDetails[crn].tierDetails = tierDetails
    } else {
      ;({ tierDetails } = req.session.data.personalDetails[crn])
      if (!tierDetails) {
        const { tierData, tierDataIsLoading } = await fetchTierDetails(crn, token)

        tierDetails = !tierDataIsLoading ? tierData : undefined
        req.session.data.personalDetails[crn].tierDetails = tierDetails
      }
    }

    res.locals.tierUrlV3 = tierUrlV3(crn)
    res.locals.tierDetails = tierDetails

    return next()
  }
}
