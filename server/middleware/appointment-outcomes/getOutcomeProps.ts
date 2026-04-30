import { DateTime } from 'luxon'
import { Activity } from '../../data/model/schedule'
import {
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSession,
  AttendedCompliedAppointment,
} from '../../models/Appointments'
import { getDataValue } from '../../utils/getDataValue'
import { convertToTitleCase } from '../../utils/convertToTitleCase'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { Route } from '../../@types'
import { dateWithDayAndWithYear, fullName, isNumericString, isValidCrn, isValidUUID } from '../../utils'
import { Sentence } from '../../data/model/sentenceDetails'
import { AppointmentOutcomeSentence } from '../../models/Locals'
import { enforcementActionMap, outcomeMap } from '../../properties/appointment-outcomes'

export const getOutcomeProps: Route<void> = (req, res, next) => {
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
    type: appointmentSentence?.sentenceType,
    length: sentenceLength,
  }
  let currentOutcome: AppointmentOutcomeType
  let currentEnforcementAction: AppointmentEnforcementAction
  if ((appointment as Activity)?.outcome) {
    currentOutcome = Object.entries(outcomeMap).find(
      ([_key, { description }]) => description.toLowerCase() === (appointment as Activity).outcome.toLowerCase(),
    )?.[0] as AppointmentOutcomeType
  }
  if ((appointment as Activity)?.action) {
    currentEnforcementAction = Object.entries(enforcementActionMap).find(
      ([_key, { description }]) => description?.toLowerCase() === (appointment as Activity).action.toLowerCase(),
    )?.[0] as AppointmentEnforcementAction
  }
  const attendedFailedToComply = appointmentSession?.outcome?.attendedFailedToComply
  const unacceptableAbsence = appointmentSession?.outcome?.acceptableAbsence
  const failedToAttend = appointmentSession?.outcome?.failedToAttend
  const sendBreachOrRecallLetter = [attendedFailedToComply, unacceptableAbsence].some(
    value => value === 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
  )
  const sendLetter = [attendedFailedToComply, unacceptableAbsence, failedToAttend].some(
    value => value === 'SEND_LETTER',
  )
  const appointmentHintText = `Appointment: ${appointment.type} with ${convertToTitleCase(fullName(appointment.officer.name))} on ${dateWithDayAndWithYear(appointment.startDateTime)}.`
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
    sentence,
    isProbationPractitioner,
    appointmentHintText,
    sendBreachOrRecallLetter,
    sendLetter,
    currentOutcome,
    currentEnforcementAction,
  }
  return next()
}
