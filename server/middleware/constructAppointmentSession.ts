import { Request, NextFunction } from 'express'
import { AppointmentSession, YesNo } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

const booleanToYesNo = (answer: boolean): YesNo => (answer === true ? 'Yes' : 'No')

export const constructNextAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn } = req.params
  const { nextAppointment: nextAppointmentSelection } = req.body
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
  const visorReport = appointment?.isVisor !== undefined ? booleanToYesNo(appointment.isVisor) : ''
  const date = appointment?.startDateTime || ''
  const end = appointment?.endDateTime || ''
  const sensitivity = appointment?.isSensitive !== undefined ? booleanToYesNo(appointment.isSensitive) : ''

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

  if (nextAppointmentSelection === 'KEEP_TYPE') {
    if (!eventId || !type || !providerCode || !teamCode || !username) {
      if (!eventId) {
        type = ''
      }
      providerCode = ''
      teamCode = ''
      username = ''
      locationCode = ''
    }

    nextAppointment = {
      ...nextAppointment,
      user: {
        providerCode,
        teamCode,
        username,
        locationCode,
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
      notes,
      sensitivity,
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
