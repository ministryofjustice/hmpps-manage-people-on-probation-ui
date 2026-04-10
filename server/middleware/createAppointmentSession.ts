import { Request, NextFunction } from 'express'
import { AppResponse } from '../models/Locals'
import { isoToDateTime, setDataValue } from '../utils'
import { AppointmentSession, AppointmentSessionSelection, YesNo } from '../models/Appointments'

const booleanToYesNo = (answer: boolean): YesNo => (answer === true ? 'Yes' : 'No')

export const createAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn, id, contactId } = req.params as Record<string, string>
  const selection: AppointmentSessionSelection = req?.body?.nextAppointment || 'KEEP_TYPE'
  let appointmentSession: AppointmentSession = {
    eventId: '',
    username: res.locals.user.username,
    uuid: '',
  }
  if (['KEEP_TYPE', 'RESCHEDULE'].includes(selection)) {
    if (selection === 'RESCHEDULE') {
      appointmentSession.rescheduleAppointment = {
        ...(req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment ?? {}),
        previousStart: appointment.startDateTime,
        previousEnd: appointment.endDateTime,
      }
    }
    const { appointmentTypes } = res.locals
    let eventId = appointment?.eventId || ''
    const sentences = req?.session?.data?.sentences?.[crn]
    if (!eventId && appointment?.eventNumber) {
      if (sentences) {
        eventId = sentences.find(sentence => sentence?.eventNumber === appointment.eventNumber)?.id || ''
      }
    }
    if (eventId && !sentences.some(sentence => sentence.id.toString() === eventId.toString())) {
      eventId = ''
    }
    const matchingType = appointmentTypes.find(t => t?.description === appointment?.type)
    let type = matchingType?.code || ''
    if (!eventId && matchingType?.isPersonLevelContact === true) {
      eventId = 'PERSON_LEVEL_CONTACT'
    }
    let locationCode = appointment?.location?.code || ''
    if (matchingType?.isLocationRequired === false && !locationCode) {
      locationCode = 'NO_LOCATION_REQUIRED'
    }
    let username = appointment?.officer?.username || ''
    let teamCode = appointment?.officer?.teamCode || ''
    const staffCode = appointment?.officer?.code || ''
    let providerCode = appointment?.officer?.providerCode || ''
    const visorReport = appointment?.isVisor !== undefined ? booleanToYesNo(appointment.isVisor) : ''
    let date = ''
    let start = ''
    let end = ''
    if (appointment?.startDateTime) {
      ;({ date, time: start } = isoToDateTime(appointment.startDateTime))
    }
    if (appointment?.endDateTime) {
      ;({ time: end } = isoToDateTime(appointment.endDateTime))
    }
    const externalReference = appointment?.externalReference || ''
    if (!eventId) {
      type = ''
    }
    if (!providerCode || !teamCode || !username) {
      providerCode = ''
      teamCode = ''
      username = ''
    }
    if (!eventId || !type || !providerCode || !teamCode || !username) {
      locationCode = ''
    }
    appointmentSession = {
      ...appointmentSession,
      user: {
        providerCode,
        teamCode,
        username,
        locationCode,
        staffCode,
      },
      type,
      date,
      start,
      end,
      eventId: eventId?.toString(),
      username: res.locals.user.username,
      uuid: '',
      externalReference,
    }
    if (visorReport) {
      appointmentSession.visorReport = visorReport
    }
    if (appointment?.component?.type === 'REQUIREMENT') {
      appointmentSession.requirementId = appointment?.component?.id.toString() || ''
    }
    if (appointment?.component?.type === 'LICENCE_CONDITION') {
      appointmentSession.licenceConditionId = appointment?.component?.id?.toString() || ''
    }
    if (appointment?.nsiId) {
      appointmentSession.nsiId = appointment.nsiId.toString()
    }
    if (appointment?.officer?.name) {
      appointmentSession.user.name = appointment.officer.name
    }
    appointmentSession.smsOptIn = null
  }
  res.locals.appointmentSession = appointmentSession
  if (contactId) {
    setDataValue(req.session.data, ['appointments', crn, contactId], appointmentSession)
  }
  return next()
}
