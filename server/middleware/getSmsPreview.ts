import { logger } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import ESupervisionClient from '../data/eSupervisionClient'
import { SmsPreviewRequest, SmsPreviewResponse } from '../data/model/esupervision'
import { AppointmentSession } from '../models/Appointments'
import { getDataValue, isoFromDateTime, responseIsError, setDataValue } from '../utils'
import { Location } from '../data/model/caseload'

export const getSmsPreview = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next?) => {
    const { crn, id: uuid } = req.params as Record<string, string>
    const { username } = res.locals.user
    const {
      name: { forename: firstName },
    } = res.locals.case
    let appointmentLocation = ''
    let preview: SmsPreviewResponse | null = null

    const { data } = req.session
    const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const locations = getDataValue<Location[]>(data, ['locations', username])
    const {
      type: appointmentType,
      date,
      start,
      user: { locationCode },
      smsPreview,
    } = appointment
    if (smsPreview) {
      preview = smsPreview
    } else {
      const locationMatch = locations.find(loc => loc.code === locationCode)
      if (locationMatch) {
        appointmentLocation = locationMatch?.address?.officeName || locationMatch?.address?.buildingName || ''
      }
      const preferredLanguage = getDataValue<string>(data, ['personalDetails', crn, 'overview', 'preferredLanguage'])
      const includeWelshPreview = preferredLanguage === 'Welsh'
      const dateAndTimeOfAppointment = isoFromDateTime(date, start)
      const body: SmsPreviewRequest = {
        firstName,
        dateAndTimeOfAppointment,
        appointmentType,
        includeWelshPreview,
      }
      if (appointmentLocation) body.appointmentLocation = appointmentLocation
      const token = await hmppsAuthClient.getSystemClientToken(username)
      const eSupervisionClient = new ESupervisionClient(token)
      try {
        const response = await eSupervisionClient.postSmsPreview(body)
        if (!responseIsError<SmsPreviewResponse>(response)) {
          preview = response
        }
      } catch (err: any) {
        const error = err as Error
        logger.error(`SMS preview request error: ${error.message}`)
      }
      setDataValue(data, ['appointments', crn, uuid, 'smsPreview'], preview)
    }
    res.locals.smsPreview = preview
    return next()
  }
}
