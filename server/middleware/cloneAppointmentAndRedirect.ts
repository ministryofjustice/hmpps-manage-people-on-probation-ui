import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { setDataValue } from '../utils'

export const cloneAppointmentAndRedirect = (appointmentToClone: AppointmentSession, { clearType = false } = {}) => {
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
    }
    if (clearType) clonedAppt.type = ''
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  }
}
