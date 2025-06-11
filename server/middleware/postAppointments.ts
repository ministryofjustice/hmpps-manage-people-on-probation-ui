import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getDataValue } from '../utils'
import { appointmentTypes } from '../properties'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import { Route } from '../@types'
import { AppointmentRequestBody } from '../models/Appointments'

export const dateTime = (date: string, time: string): Date => {
  const isPm = time.includes('pm')
  const [hour, minute] = time
    .split('am')
    .join('')
    .split('pm')
    .join('')
    .split(':')
    .map(val => parseInt(val, 10))
  const newHour = isPm && hour !== 12 ? hour + 12 : hour
  const [year, month, day] = date.split('-').map(val => parseInt(val, 10))
  return new Date(year, month, day, newHour, minute, 0)
}

export const postAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id: uuid } = req.params
    const { username } = res.locals.user
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { data } = req.session
    const sentences: Sentence[] = getDataValue(data, ['sentences', crn])
    const userLocations: UserLocation[] = getDataValue(data, ['locations', username])
    const {
      type: appointmentType,
      date,
      location: selectedLocation,
      'start-time': startTime,
      'end-time': endTime,
      'repeating-frequency': interval,
      'repeating-count': repeatCount,
      sentence: selectedSentence,
      'sentence-requirement': sentenceRequirement,
      'sentence-licence-condition': sentenceLicenceCondition,
    } = getDataValue(data, ['appointments', crn, uuid])

    const type = appointmentTypes.find(t => t.text === appointmentType).value
    const sentence = sentences.find(s => s.order.description === selectedSentence)
    const { eventId } = sentence
    const locationId = userLocations.find(location => location.description === selectedLocation).id
    const requirementId =
      sentence?.requirements?.find(requirement => requirement.description === sentenceRequirement)?.id || 0
    const licenceConditionId =
      sentence?.licenceConditions?.find(
        licenceCondition => licenceCondition.mainDescription === sentenceLicenceCondition,
      )?.id || 0

    const body: AppointmentRequestBody = {
      user: {
        username,
        locationId,
      },
      type,
      start: dateTime(date, startTime),
      end: dateTime(date, endTime),
      interval,
      numberOfAppointments: parseInt(repeatCount, 10),
      eventId,
      createOverlappingAppointment: true,
      requirementId,
      licenceConditionId,
      uuid,
    }
    await masClient.postAppointments(crn, body)
    return next()
  }
}
