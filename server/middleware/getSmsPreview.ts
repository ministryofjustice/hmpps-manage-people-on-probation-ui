import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppointmentSession, SmsPreview, SmsPreviewRequest } from '../models/Appointments'
import { getDataValue, isWelshPostcode, responseIsError, setDataValue } from '../utils'
import { Location } from '../data/model/caseload'

export const getSmsPreview = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next?) => {
    const { crn, id: uuid } = req.params
    const { username } = res.locals.user
    const {
      name: { forename: name },
    } = res.locals.case
    let location = ''
    let preview: string[] | null = null
    const { data } = req.session
    const appointment = getDataValue<AppointmentSession>(data, ['appointments', crn, uuid])
    const locations = getDataValue<Location[]>(data, ['locations', username])
    const {
      date,
      start,
      user: { locationCode },
      smsPreview,
    } = appointment
    if (smsPreview) {
      ;({ preview } = smsPreview)
    } else {
      const locationMatch = locations.find(loc => loc.code === locationCode)
      if (locationMatch) {
        location = locationMatch?.address?.officeName || locationMatch?.address?.buildingName || ''
      }
      const postcode = res.locals.case?.mainAddress?.postcode
      const welsh = postcode ? isWelshPostcode(postcode) : false
      const body: SmsPreviewRequest = {
        name,
        date,
        start,
        welsh,
      }
      if (location) body.location = location
      const token = await hmppsAuthClient.getSystemClientToken(username)
      const masClient = new MasApiClient(token)
      try {
        const response = await masClient.postSmsPreview(body)
        if (!responseIsError(response)) {
          ;({ preview } = response)
        }
      } catch (err: any) {
        const error = err as Error
        logger.error(`SMS preview request error: ${error.message}`)
      }
      const previewSession: SmsPreview = { name, location, welsh, preview }
      setDataValue(data, ['appointments', crn, uuid, 'smsPreview'], previewSession)
    }
    res.locals.smsPreview = preview
    return next()
  }
}
