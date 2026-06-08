import { DateTime } from 'luxon'
import { Activity } from '../../data/model/schedule'
import { AppointmentSession, AttendedCompliedAppointment } from '../../models/Appointments'
import { getDataValue } from '../../utils/getDataValue'
import { convertToTitleCase } from '../../utils/convertToTitleCase'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { Route } from '../../@types'
import { dateWithDayAndWithYear, fullName, isNumericString, isValidCrn, isValidUUID } from '../../utils'
import { Sentence } from '../../data/model/sentenceDetails'
import { AppointmentOutcomeSentence } from '../../models/Locals'
import { Document } from '../../data/model/personalDetails'
import { renderError } from '../renderError'

export const getOutcomeProps: Route<void> = (req, res, next) => {
  const { crn, id: uuid } = req.params as Record<string, string>
  let { contactId } = req.params as Record<string, string>
  let id = uuid || contactId
  const data = req?.session?.data
  const responseContactId = getDataValue(data, ['temp', crn, 'responseContactId']) || null
  const linkedContactId = getDataValue(data, ['temp', crn, 'linkedContactId']) || null

  // override contact id with response contact id if exists 👇

  if (responseContactId) {
    id = responseContactId
    contactId = responseContactId
  }

  const isValidId = contactId ? isNumericString(contactId) : isValidUUID(uuid)
  const isValidParams = isValidCrn(crn) && isValidId
  const path = ['appointments', crn, id]
  const appointmentSession = getDataValue<AppointmentSession>(data, path) || null
  let appointment: AttendedCompliedAppointment | Activity
  let documents: Document[] = []
  const { forename, surname } = res.locals.case.name
  const reqUrl = req.url.split('?')[0]
  const baseUrl = uuid ? `/case/${crn}/arrange-appointment/${id}` : `/case/${crn}/appointments/appointment/${id}`
  const baseOutcomeUrl = `${baseUrl}/outcome`
  const completedUrl = uuid ? `${baseUrl}/check-your-answers` : `${baseUrl}/manage`
  if (contactId) {
    appointment = res.locals?.personAppointment?.appointment || null
    documents = res.locals?.personAppointment?.documents || []
  } else {
    const description = res?.locals?.appointment?.type?.description
    const name = res?.locals?.appointment?.attending?.name
    let officerForename = ''
    let officerSurname = ''
    if (name) {
      ;[officerForename, officerSurname] = name.split(' ')
    }

    if (!appointmentSession) {
      return renderError(404)(req, res)
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
  /*
  const sentences = getDataValue<Sentence[]>(data, ['sentences', crn])
  const eventId = appointmentSession?.eventId
  const appointmentSentence: Sentence = eventId
    ? sentences.find(_sentence => _sentence.id.toString() === eventId)
    : null
  const startDate = appointmentSentence?.order?.startDate
  const endDate = appointmentSentence?.order?.endDate
  let sentenceLength = null
  if (startDate && endDate) {
    const start = DateTime.fromISO(startDate)
    const end = DateTime.fromISO(endDate)
    sentenceLength = end.diff(start, 'months').months
  }
  const sentence: AppointmentOutcomeSentence = {
    type: appointmentSentence?.order?.sentenceType,
    length: sentenceLength,
    eventId: appointmentSentence.id,
    eventNumber: appointmentSentence?.eventNumber || null,
    order: appointmentSentence?.order?.description,
  }
*/
  const attendedFailedToComply = appointmentSession?.outcome?.attendedFailedToComply
  const unacceptableAbsence = appointmentSession?.outcome?.unacceptableAbsence
  const updateEnforcementAction = appointmentSession?.outcome?.updateEnforcementAction
  const failedToAttend = appointmentSession?.outcome?.failedToAttend
  const sendBreachOrRecallLetter = [attendedFailedToComply, unacceptableAbsence, updateEnforcementAction].some(
    value => value === 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
  )
  const sendLetter = [attendedFailedToComply, unacceptableAbsence, failedToAttend].some(
    value => value === 'SEND_LETTER',
  )
  const appointmentHintText =
    appointment?.type && appointment?.officer?.name && appointment?.startDateTime
      ? `Appointment: ${appointment.type} with ${convertToTitleCase(fullName(appointment.officer.name))} on ${dateWithDayAndWithYear(appointment.startDateTime)}.`
      : null

  const probationPractitioner = getDataValue(data, ['personalDetails', crn, 'probationPractitioner'])
  const isProbationPractitioner = probationPractitioner?.username === res.locals.user.username
  res.locals.appointmentOutcome = {
    forename,
    surname,
    appointment,
    documents,
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
    // sentence,
    isProbationPractitioner,
    appointmentHintText,
    sendBreachOrRecallLetter,
    sendLetter,
    responseContactId,
    linkedContactId,
  }
  return next()
}
