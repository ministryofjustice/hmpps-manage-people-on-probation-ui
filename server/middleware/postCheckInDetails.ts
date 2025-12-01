import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'
import { LocationInfo, OffenderInfo, OffenderSetup } from '../data/model/eSuperVision'
import logger from '../../logger'
import { ProbationPractitioner } from '../data/model/caseload'

export const postCheckInDetails = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<{ setup: OffenderSetup; uploadLocation: LocationInfo }>> => {
  return async (req, res) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const caseDetails = res.locals.case
    const savedUserDetails = req.session.data?.esupervision?.[crn]?.[id]?.checkins

    // firstCheckinDate is provided in format dd/M/yyyy. Convert to yyyy/M/dd as required by API.
    const parsedFirstCheckin = DateTime.fromFormat(savedUserDetails?.date ?? '', 'd/M/yyyy')
    const firstCheckinDate = parsedFirstCheckin.isValid
      ? parsedFirstCheckin.toFormat('yyyy/M/dd')
      : savedUserDetails?.date
    const masClient = new MasApiClient(token)
    const pp: ProbationPractitioner = await masClient.getProbationPractitioner(crn)
    const practitionerId = pp?.username ? pp.username : res.locals.user.username
    const data: OffenderInfo = {
      setupUuid: id,
      practitionerId,
      firstName: caseDetails.name.forename,
      lastName: caseDetails.name.surname,
      dateOfBirth: caseDetails.dateOfBirth,
      crn,
      email: savedUserDetails.checkInEmail,
      phoneNumber: savedUserDetails.checkInMobile,
      firstCheckinDate,
      checkinInterval: savedUserDetails.interval,
      startedAt: new Date().toISOString(),
    }
    logger.info('Checkin Registration started')
    logger.info('message: ', data)
    try {
      const setup: OffenderSetup = await eSupervisionClient.postOffenderSetup(data)
      const uploadLocation: LocationInfo = await eSupervisionClient.getProfilePhotoUploadLocation(setup, 'image/jpeg')
      logger.info('locationInfo', { uploadLocation })
      return { setup, uploadLocation }
    } catch (error) {
      const statusCode = error?.data?.status || 500
      logger.error(`locationInfo statusCode : ${statusCode}`)
      // Re-throw to allow upstream handlers to decide if they want to stop further processing
      throw error
    }
  }
}
