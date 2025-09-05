import { Request, NextFunction } from 'express'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { appointmentTypes, sentences } = res.locals
  const type = appointmentTypes.find(t => t.description === appointment.type)?.code
  const eventId = sentences.find(sentence => sentence.eventNumber === appointment.eventNumber)?.id
  let notes = ''
  if (appointment?.appointmentNotes) {
    notes = appointment.appointmentNotes.map(appointmentNote => appointmentNote.note).join('\n')
  } else if (appointment?.appointmentNote) {
    notes = appointment.appointmentNote.note
  }
  const nextAppointment: AppointmentSession = {
    user: {
      providerCode: appointment.officer.providerCode,
      teamCode: appointment.officer.teamCode,
      username: appointment.officer.username,
      locationCode: appointment.location ? appointment.location.code : 'I do not need to pick a location',
    },
    type: type || '',
    visorReport: appointment?.isVisor ? 'Yes' : 'No',
    date: appointment.startDateTime,
    start: appointment.startDateTime,
    end: appointment.endDateTime,
    until: appointment.endDateTime,
    interval: 'DAY',
    numberOfAppointments: '1',
    numberOfRepeatAppointments: '0',
    eventId: eventId?.toString() || '',
    username: res.locals.user.username,
    uuid: '', // this needs assigning when cloned,
    repeating: 'No',
    repeatingDates: [],
    notes,
    sensitivity: appointment?.isSensitive ? 'Yes' : 'No',
  }
  if (appointment?.component.type === 'REQUIREMENT') {
    nextAppointment.requirementId = appointment.component.id.toString()
  }
  if (appointment?.component.type === 'LICENCE_CONDITION') {
    nextAppointment.licenceConditionId = appointment.component.id.toString()
  }
  if (appointment?.nsiId) {
    nextAppointment.nsiId = appointment.nsiId.toString()
  }
  res.locals.nextAppointmentSession = nextAppointment
  return next()
}
