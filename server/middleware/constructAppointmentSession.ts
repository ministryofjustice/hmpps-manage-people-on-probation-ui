import { Request, NextFunction } from 'express'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn } = req.params
  const { appointmentTypes } = res.locals
  let eventId = appointment?.eventId || ''
  if (!eventId && appointment?.eventNumber) {
    const sentences = req?.session?.data?.sentences?.[crn]
    if (sentences) {
      eventId = sentences.find(sentence => sentence?.eventNumber === appointment.eventNumber)?.id || ''
    }
  }
  let notes = ''
  if (appointment?.appointmentNotes) {
    notes = appointment.appointmentNotes.map(appointmentNote => appointmentNote.note).join('\n')
  } else if (appointment?.appointmentNote?.note) {
    notes = appointment.appointmentNote.note
  }
  const selectedType = appointmentTypes.find(t => t?.description === appointment?.type)
  let locationCode = appointment?.location?.code || ''
  if (!selectedType?.isLocationRequired && !locationCode) {
    locationCode = 'NO_LOCATION_REQUIRED'
  }

  let type = appointmentTypes.find(t => t?.description === appointment?.type)?.code || ''
  let username = appointment?.officer?.username || ''
  let teamCode = appointment?.officer?.teamCode || ''
  let providerCode = appointment?.officer?.providerCode || ''

  if (!eventId) {
    type = ''
    locationCode = ''
    providerCode = ''
    teamCode = ''
    username = ''
  }

  if (!type) {
    locationCode = ''
    providerCode = ''
    teamCode = ''
    username = ''
  }

  if (!providerCode || !teamCode || !username) {
    locationCode = ''
  }
  const nextAppointment: AppointmentSession = {
    user: {
      providerCode,
      teamCode,
      username,
      locationCode,
    },
    type,
    visorReport: appointment?.isVisor ? 'Yes' : 'No',
    date: appointment?.startDateTime || '',
    start: appointment?.startDateTime || '',
    end: appointment?.endDateTime || '',
    until: appointment?.endDateTime || '',
    interval: 'DAY',
    numberOfAppointments: '1',
    numberOfRepeatAppointments: '0',
    eventId: eventId?.toString() || '',
    username: res.locals.user.username,
    uuid: '',
    repeating: 'No',
    repeatingDates: [],
    notes,
    sensitivity: appointment?.isSensitive ? 'Yes' : 'No',
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
  res.locals.nextAppointmentSession = nextAppointment
  return next()
}
