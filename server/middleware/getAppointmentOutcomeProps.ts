import { DateTime } from 'luxon'
import { Activity } from '../data/model/schedule'
import { AppointmentSession, AttendedCompliedAppointment } from '../models/Appointments'
import { getDataValue } from '../utils/getDataValue'
import { convertToTitleCase } from '../utils/convertToTitleCase'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { Route } from '../@types'
import { isNumericString, isValidCrn, isValidUUID } from '../utils'
import { Sentence, SentenceType } from '../data/model/sentenceDetails'

export const getAppointmentOutcomeProps: Route<void> = (req, res, next) => {
  const { crn, id: uuid, contactId } = req.params as Record<string, string>
  const id = uuid || contactId
  const isValidId = contactId ? isNumericString(contactId) : isValidUUID(uuid)
  const isValidParams = isValidCrn(crn) && isValidId
  const path = ['appointments', crn, id]
  const data = req?.session?.data
  const appointmentSession = getDataValue<AppointmentSession>(data, path)
  let appointment: AttendedCompliedAppointment | Activity
  const { forename, surname } = res.locals.case.name
  const reqUrl = req.url.split('?')[0]
  const baseUrl = uuid ? `/case/${crn}/arrange-appointment/${id}` : `/case/${crn}/appointments/appointment/${id}`
  const baseOutcomeUrl = `${baseUrl}/outcome`
  const completedUrl = uuid ? `${baseUrl}/check-your-answers` : `${baseUrl}/manage`
  if (contactId) {
    ;({ appointment } = res.locals.personAppointment)
  } else {
    const description = res?.locals?.appointment?.type?.description
    const name = res?.locals?.appointment?.attending?.name
    let officerForename = ''
    let officerSurname = ''
    if (name) {
      ;[officerForename, officerSurname] = name.split(' ')
    }
    const startDateTime = DateTime.fromISO(`${appointmentSession.date}T${appointmentSession.start}`, {
      zone: 'Europe/London',
    }).toISO({ suppressMilliseconds: true })

    appointment = {
      type: description,
      officer: {
        name: { forename: convertToTitleCase(officerForename), surname: convertToTitleCase(officerSurname) },
      },
      startDateTime,
    }
  }
  const isInPast = appointmentDateIsInPast(req)
  const sentences = getDataValue<Sentence[]>(data, ['sentences', crn])
  const eventId = appointmentSession?.eventId
  const sentenceType: SentenceType = eventId
    ? sentences.find(_sentence => _sentence.id.toString() === eventId)?.sentenceType
    : null
  const probationPractitioner = getDataValue(data, ['personalDetails', crn, 'probationPractitioner'])
  const isProbationPractitioner = probationPractitioner?.username === res.locals.user.username
  res.locals.appointmentOutcome = {
    forename,
    surname,
    appointment,
    crn,
    uuid,
    contactId,
    id,
    isValidParams,
    isInPast,
    reqUrl,
    baseUrl,
    baseOutcomeUrl,
    completedUrl,
    appointmentSession,
    sentenceType,
    isProbationPractitioner,
  }
  return next()
}
