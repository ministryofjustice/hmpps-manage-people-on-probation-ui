import { NextFunction } from 'express'
import { Activity } from '../data/model/schedule'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

export const constructNextAppointmentSession = (appointment: Activity) => {
  return (_req: Request, res: AppResponse, next: NextFunction): void => {
    const nextAppointment: AppointmentSession = {
      user: {
        providerCode: '', // ? requires API update
        teamCode: '', // ? requires API update
        username: '', // ? requires API update
        locationCode: '', // ? requires API update
      },
      type: appointment.type,
      visorReport: appointment?.isVisor ? 'Yes' : 'No',
      date: appointment.startDateTime,
      start: appointment.startDateTime,
      end: appointment.endDateTime,
      until: appointment.endDateTime,
      interval: 'DAY',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      eventId: appointment.eventNumber,
      username: res.locals.user.username,
      uuid: '', // this needs assigning when cloned,
      requirementId: '', // ? requires API update
      licenceConditionId: '', // ? requires API update
      nsiId: '', // ? requires API update
      repeating: 'No',
      repeatingDates: [],
      notes: appointment?.appointmentNotes?.[0]?.note || '', // need to confirm sending an array of notes?
      sensitivity: appointment?.isSensitive ? 'Yes' : 'No',
    }
    res.locals.nextAppointmentSession = nextAppointment
    return next()
  }
}
