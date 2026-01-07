import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'
import { LocationInfo, OffenderInfo, OffenderSetup } from '../data/model/esupervision'
import logger from '../../logger'
import { ProbationPractitioner } from '../models/CaseDetail'

export const postCheckInDetails = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<{ setup: OffenderSetup; uploadLocation: LocationInfo }>> => {
  return async (req, res) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
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
      crn,
      firstCheckin: firstCheckinDate,
      checkinInterval: savedUserDetails.interval,
      startedAt: new Date().toISOString(),
      contactPreference: savedUserDetails.preferredComs,
    }
    logger.info('Checkin Registration started')
    try {
      const setup: OffenderSetup = await eSupervisionClient.postOffenderSetup(data)
      const uploadLocation: LocationInfo = await eSupervisionClient.getProfilePhotoUploadLocation(setup, 'image/jpeg')
      return { setup, uploadLocation }
    } catch (error) {
      const statusCode = error?.data?.status || 500
      logger.error(`locationInfo statusCode : ${statusCode}`)
      // Re-throw to allow upstream handlers to decide if they want to stop further processing
      throw error
    }
  }
}
