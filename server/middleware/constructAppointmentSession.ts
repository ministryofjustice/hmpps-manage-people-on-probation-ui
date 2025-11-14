import { Request, NextFunction } from 'express'
import { AppointmentSession, YesNo } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

const booleanToYesNo = (answer: boolean): YesNo => (answer === true ? 'Yes' : 'No')

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn, id, appointmentType } = req.params
  const { nextAppointment: nextAppointmentSelection } = req.body

  let nextAppointment: AppointmentSession = {
    interval: 'DAY',
    numberOfAppointments: '1',
    numberOfRepeatAppointments: '0',
    eventId: '',
    username: res.locals.user.username,
    uuid: '',
    repeating: 'No',
    repeatingDates: [],
  }

  if (nextAppointmentSelection === 'KEEP_TYPE' || nextAppointmentSelection === 'RESCHEDULE') {
    const { appointmentTypes } = res.locals
    let eventId = appointment?.eventId || ''
    const sentences = req?.session?.data?.sentences?.[crn]
    const rescheduleAppointment = req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment

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
    const date = appointment?.startDateTime || ''
    const end = appointment?.endDateTime || ''

    /*
      If event has not been selected, then the user cannot select type or location, but can select the attendee
      If type has not been selected, then the user cannot select location, but can select the attendee
      if attendee has not been selected, then the user cannot select the location.
    */

    /* constructed session does not include notes or sensitivity */

    /*
      If event has not been selected, then the user cannot select type or location, but can select the attendee
      If type has not been selected, then the user cannot select location, but can select the attendee
      if attendee has not been selected, then the user cannot select the location.
    */

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
      start: date,
      end,
      until: end,
      interval: 'DAY',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      eventId: eventId?.toString(),
      username: res.locals.user.username,
      uuid: '',
      repeating: 'No',
      repeatingDates: [],
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
  }
  res.locals.nextAppointmentSession = nextAppointment
  return next()
}
