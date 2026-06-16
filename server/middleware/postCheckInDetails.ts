import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'
import { UploadLocationResponse, OffenderInfo, OffenderSetup } from '../data/model/esupervision'
import logger from '../../logger'
import { ProbationPractitioner } from '../models/CaseDetail'

export const postCheckInDetails = (
  hmppsAuthClient: HmppsAuthClient,
): Route<Promise<{ setup: OffenderSetup; uploadLocation: UploadLocationResponse }>> => {
  return async (req, res) => {
    const { crn, id } = req.params as Record<string, string>
    // The browser sends a base64-encoded SHA-256 digest (see assets/js/photo.js sha256Base64).
    // S3 enforces the matching x-amz-checksum-sha256 on the PUT, so we only guard presence here.
    const contentSha256 = typeof req.body?.contentSha256 === 'string' ? req.body.contentSha256.trim() : ''
    if (!contentSha256) {
      logger.error('Checkin Registration rejected: missing contentSha256')
      throw Object.assign(new Error('contentSha256 is required'), {
        data: { status: 400, userMessage: 'contentSha256 is required' },
      })
    }
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
      eligibilityChoice: savedUserDetails.eligibilityChoice
    }
    logger.info('Checkin Registration started')
    try {
      const setup: OffenderSetup = await eSupervisionClient.postOffenderSetup(data)
      const uploadLocation: UploadLocationResponse = await eSupervisionClient.getProfilePhotoUploadLocation(
        setup,
        'image/jpeg',
        contentSha256,
      )
      return { setup, uploadLocation }
    } catch (error) {
      const statusCode = error?.data?.status || 500
      logger.error(`locationInfo statusCode : ${statusCode}`)
      // Re-throw to allow upstream handlers to decide if they want to stop further processing
      throw error
    }
  }
}
