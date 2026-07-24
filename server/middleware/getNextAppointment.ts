import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { NextAppointmentResponse } from '../models/SupervisionPackage'

export const getNextAppointment = (
  hmppsAuthClient: HmppsAuthClient,
  mpopComponents: MPoPComponents,
): Route<Promise<void>> => {
  const fetchNextAppointment = async (
    crn: string,
    token: string,
  ): Promise<{
    nextAppointmentData: NextAppointmentResponse
    nextAppointmentDataIsLoading: boolean
    nextAppointmentDataError: Error | undefined
  }> => {
    let nextAppointmentData: NextAppointmentResponse = { personSchedule: null, httpStatus: 500 }
    let nextAppointmentDataIsLoading: boolean = false
    let nextAppointmentDataError: Error | undefined

    try {
      nextAppointmentDataIsLoading = true
      // Introspect the actual base URL the library's internal masApiRestClient is configured
      // with at runtime, rather than assuming which config was passed in.
      nextAppointmentData = await mpopComponents.getPersonSchedule(token, crn)
      if (nextAppointmentData?.httpStatus !== 200) {
        nextAppointmentDataError = new Error(
          `Failed to fetch next appointment for CRN ${crn}. HTTP status: ${nextAppointmentData?.httpStatus}`,
        )
        logger.error(nextAppointmentDataError, 'Failed to fetch next appointment from MPoP Components API.')
      }
    } catch (err) {
      nextAppointmentDataError =
        typeof err === 'object' && err !== null && 'message' in err
          ? new Error(String((err as any).message))
          : new Error(`Failed to fetch next appointment for CRN ${crn}`)
      logger.error(nextAppointmentDataError, 'Failed to connect to MPoP Components API.')
    } finally {
      nextAppointmentDataIsLoading = false
    }
    return {
      nextAppointmentData,
      nextAppointmentDataIsLoading,
      nextAppointmentDataError,
    }
  }

  return async (req, res, next) => {
    // If the feature flag is not enabled, skip fetching next appointment and proceed to the next middleware
    if (!res.locals.flags?.enableSupervisionPackage) return next()

    const { crn } = req.params as Record<string, string>
    let nextAppointmentResponse: NextAppointmentResponse | undefined

    req.session.data.personalDetails ??= {}
    req.session.data.personalDetails[crn] ??= {} as any
    if (process.env.NODE_ENV === 'development') {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
      const { nextAppointmentData, nextAppointmentDataIsLoading } = await fetchNextAppointment(crn, token)
      nextAppointmentResponse = !nextAppointmentDataIsLoading ? nextAppointmentData : undefined
      req.session.data.personalDetails[crn].nextAppointmentResponse = nextAppointmentResponse
    } else {
      ;({ nextAppointmentResponse } = req.session.data.personalDetails[crn])
      if (!nextAppointmentResponse) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
        const { nextAppointmentData, nextAppointmentDataIsLoading } = await fetchNextAppointment(crn, token)
        nextAppointmentResponse = !nextAppointmentDataIsLoading ? nextAppointmentData : undefined
        req.session.data.personalDetails[crn].nextAppointmentResponse = nextAppointmentResponse
      }
    }

    if (nextAppointmentResponse?.httpStatus === 200) {
      res.locals.nextAppointmentDetails = nextAppointmentResponse.personSchedule.personSchedule.appointments[0] || null
    }

    return next()
  }
}
