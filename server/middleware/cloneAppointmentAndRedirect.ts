import { Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { setDataValue } from '../utils'

interface Params {
  clearDate?: boolean
  clearType?: boolean
}

export const cloneAppointmentAndRedirect = (appointmentToClone: AppointmentSession, params?: Params) => {
  return (req: Request, res: AppResponse): void => {
    const { clearDate = false, clearType = false } = params
    const uuid = uuidv4()
    const { data } = req.session
    const { crn } = req.params
    let clonedAppt: AppointmentSession = {
      ...appointmentToClone,
      uuid,
    }
    if (clearDate) {
      clonedAppt = {
        ...clonedAppt,
        date: '',
        start: '',
        end: '',
        repeatingDates: [] as string[],
        until: '',
        numberOfAppointments: '1',
        numberOfRepeatAppointments: '0',
        repeating: 'No',
      }
    }
    if (clearType) {
      clonedAppt = {
        ...clonedAppt,
        type: '',
      }
    }
    setDataValue(data, ['appointments', crn, uuid], clonedAppt)
    return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment`)
  }
}
