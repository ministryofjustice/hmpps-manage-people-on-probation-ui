import { Request, NextFunction } from 'express'
import { DateTime } from 'luxon'
import { AppointmentSession, YesNo } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { dateIsInPast, isoToDateTime } from '../utils'

const booleanToYesNo = (answer: boolean): YesNo => (answer === true ? 'Yes' : 'No')

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn, id } = req.params
  const { nextAppointment: nextAppointmentSelection } = req.body

  let nextAppointment: AppointmentSession = {
    eventId: '',
    username: res.locals.user.username,
    uuid: '',
  }

  if (nextAppointmentSelection === 'KEEP_TYPE' || nextAppointmentSelection === 'RESCHEDULE') {
    const { appointmentTypes } = res.locals
    let eventId = appointment?.eventId || ''
    const sentences = req?.session?.data?.sentences?.[crn]
    const rescheduleAppointment = {
      ...(req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment ?? {}),
      previousStart: appointment.startDateTime,
      previousEnd: appointment.endDateTime,
    }

    if (!eventId && appointment?.eventNumber) {
      if (sentences) {
        eventId = sentences.find(sentence => sentence?.eventNumber === appointment.eventNumber)?.id || ''
      }
    }
    if (eventId && !sentences.some(sentence => sentence.id === eventId)) {
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

    nextAppointment = {
      ...nextAppointment,
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

    if (rescheduleAppointment && nextAppointmentSelection === 'RESCHEDULE') {
      nextAppointment.rescheduleAppointment = rescheduleAppointment
    }

    if (visorReport) {
      nextAppointment.visorReport = visorReport
    }
    if (appointment?.component?.type === 'REQUIREMENT') {
      nextAppointment.requirementId = appointment?.component?.id.toString() || ''
    }
    if (appointment?.component?.type === 'LICENCE_CONDITION') {
      nextAppointment.licenceConditionId = appointment?.component?.id?.toString() || ''
    }
    if (appointment?.nsiId) {
      nextAppointment.nsiId = appointment.nsiId.toString()
    }
    if (appointment?.officer?.name) {
      nextAppointment.user.name = appointment.officer.name
    }
    nextAppointment.smsOptIn = null
  }
  res.locals.nextAppointmentSession = nextAppointment
  return next()
}
