import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { SmsPreviewRequest, SmsPreviewResponse, SmsPreviewSession } from '../data/model/OutlookEvent'
import { AppointmentSession } from '../models/Appointments'
import { getDataValue, isoFromDateTime, responseIsError, setDataValue } from '../utils'
import { Location } from '../data/model/caseload'
import SupervisionAppointmentClient from '../data/SupervisionAppointmentClient'
import { Data } from '../models/Data'

export const getSmsPreview = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next?) => {
    const { crn, id: uuid } = req.params
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
      type: appointmentTypeCode,
      date,
      start,
      user: { locationCode },
      smsPreview,
    } = appointment
    const preferredLanguage = getDataValue<string>(data, ['personalDetails', crn, 'overview', 'preferredLanguage'])
    const includeWelshPreview = preferredLanguage === 'Welsh'
    const dateAndTimeOfAppointment = isoFromDateTime(date, start)
    const body: SmsPreviewRequest = {
      firstName,
      dateAndTimeOfAppointment,
      appointmentTypeCode,
      includeWelshPreview,
    }
    const locationMatch = locations.find(loc => loc.code === locationCode)
    if (locationMatch) {
      appointmentLocation =
        locationMatch?.address?.officeName || locationMatch?.address?.buildingName || locationMatch.description || ''
    }
    if (appointmentLocation) body.appointmentLocation = appointmentLocation
    if (JSON.stringify(smsPreview?.request) === JSON.stringify(body) && smsPreview?.preview) {
      ;({ preview } = smsPreview)
    } else {
      const token = await hmppsAuthClient.getSystemClientToken(username)
      const masOutlookClient = new SupervisionAppointmentClient(token)
      try {
        const response = await masOutlookClient.postSmsPreview(body)
        if (!responseIsError<SmsPreviewResponse>(response)) {
          preview = response
        }
      } catch (err: any) {
        const error = err as Error
        logger.error(`SMS preview request error: ${error.message}`)
      }
      setDataValue<Data, SmsPreviewSession>(data, ['appointments', crn, uuid, 'smsPreview'], { request: body, preview })
    }
    res.locals.smsPreview = preview
    return next()
  }
}
