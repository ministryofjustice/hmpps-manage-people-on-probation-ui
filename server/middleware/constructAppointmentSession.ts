import { Request, NextFunction } from 'express'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { appointmentTypes, sentences } = res.locals
  const type = appointmentTypes.find(t => t.description === appointment.type)?.code
  const eventId = sentences.find(sentence => sentence.eventNumber === appointment.eventNumber)?.id
  const notes = appointment?.appointmentNotes
    ? appointment.appointmentNotes.map(appointmentNote => appointmentNote.note).join('\n')
    : ''
  const nextAppointment: AppointmentSession = {
    user: {
      providerCode: 'N07', // ? requires API update
      teamCode: 'N07CHT', // ? requires API update
      username: 'tony-pan', // ? requires API update
      locationCode: 'N56NTMC', // ? requires API update
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
  if (appointment?.requirementId) {
    nextAppointment.requirementId = appointment.requirementId.toString()
  }
  if (appointment?.licenceConditionId) {
    nextAppointment.licenceConditionId = appointment.licenceConditionId.toString()
  }
  if (appointment?.nsiId) {
    nextAppointment.nsiId = appointment.nsiId.toString()
  }
  res.locals.nextAppointmentSession = nextAppointment
  return next()
}
