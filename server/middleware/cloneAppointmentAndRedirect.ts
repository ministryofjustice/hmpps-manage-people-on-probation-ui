import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession, RescheduleAppointment } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { setDataValue } from '../utils'

export const cloneAppointmentAndRedirect = (appointmentToClone: AppointmentSession) => {
  return (req: Request, res: AppResponse): void => {
    const uuid = uuidv4()
    const { data } = req.session
    const { crn } = req.params
    const clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
      date: '',
      start: '',
      end: '',
      repeatingDates: [] as string[],
      until: '',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      repeating: 'No',
      notes: null,
      sensitivity: null,
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  }
}

export const cloneAppointment = (appointmentToClone: AppointmentSession) => {
  return (req: Request, res: AppResponse): string => {
    const uuid = uuidv4()
    const { data } = req.session
    const { crn, contactId } = req.params

    const rescheduleAppointment: RescheduleAppointment = {
      whoNeedsToReschedule: null,
      reason: null,
      files: null,
    }
    const clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
      date: '',
      start: '',
      end: '',
      repeatingDates: [] as string[],
      until: '',
      numberOfAppointments: '1',
      numberOfRepeatAppointments: '0',
      repeating: 'No',
      notes: null,
      sensitivity: null,
      contactId,
      rescheduleAppointment,
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return `/case/${crn}/reschedule-appointment/${uuid}`
  }
}
