import { Request } from 'express'
import { Activity } from '../data/model/schedule'
import { AppointmentSession } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { getDataValue, convertToTitleCase } from '../utils'
import { Name } from '../data/model/personalDetails'

export interface AttendedCompliedAppointment {
  type: string
  officer: {
    name: Name
  }
  startDateTime: string
}

export const getAttendedCompliedProps = (
  req: Request,
  res: AppResponse,
): { forename: string; surname: string; appointment: AttendedCompliedAppointment | Activity } => {
  const { crn, id, contactId } = req.params as Record<string, string>
  const data = req?.session?.data
  let appointment: AttendedCompliedAppointment | Activity
  const { forename, surname } = res.locals.case.name
  if (contactId) {
    ;({ appointment } = res.locals.personAppointment)
  } else {
    const description = res?.locals?.appointment?.type?.description
    const name = res?.locals?.appointment?.attending?.name
    let officerForename = ''
    let officerSurname = ''
    if (name) {
      ;[officerForename, officerSurname] = name.split(' ')
    }
    const path = ['appointments', crn, id]
    const appointmentSession = getDataValue<AppointmentSession>(data, path)
    const startDateTime = appointmentSession?.date ?? ''
    appointment = {
      type: description,
      officer: {
        name: { forename: convertToTitleCase(officerForename), surname: convertToTitleCase(officerSurname) },
      },
      startDateTime,
    }
  }
  return { forename, surname, appointment }
}
