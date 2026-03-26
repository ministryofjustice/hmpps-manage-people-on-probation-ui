import { DateTime } from 'luxon'
import { Activity } from '../data/model/schedule'
import { AppointmentSession, AttendedCompliedAppointment } from '../models/Appointments'
import { getDataValue } from '../utils/getDataValue'
import { convertToTitleCase } from '../utils/convertToTitleCase'
import { outcomeOptions } from '../properties/outcomeOptions'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { Route } from '../@types'

export const getAttendedCompliedProps: Route<void> = (req, res, next) => {
  const { crn, id: uuid, contactId } = req.params as Record<string, string>
  const id = uuid || contactId
  const path = ['appointments', crn, id]
  const data = req?.session?.data
  const appointmentSession = getDataValue<AppointmentSession>(data, path)
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
    const startDateTime = DateTime.fromISO(`${appointmentSession.date}T${appointmentSession.start}`, {
      zone: 'utc',
    }).toISO({ suppressMilliseconds: true })

    appointment = {
      type: description,
      officer: {
        name: { forename: convertToTitleCase(officerForename), surname: convertToTitleCase(officerSurname) },
      },
      startDateTime,
    }
  }
  const isInPast = appointmentDateIsInPast(req)
  let outcomeItems = outcomeOptions
  if (isInPast && appointmentSession?.type && !['COPT', 'COVC', 'CODC'].includes(appointmentSession.type)) {
    outcomeItems = outcomeOptions.filter(option => option.value !== 'WILL_BE_RESCHEDULED')
  }
  if (isInPast && appointmentSession?.type && ['COPT', 'COVC', 'CODC'].includes(appointmentSession.type)) {
    outcomeItems = outcomeOptions.filter(
      option => !['WILL_BE_RESCHEDULED', 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES'].includes(option.value),
    )
  }
  if (!isInPast) {
    outcomeItems = outcomeItems.filter(option => ['ACCEPTABLE_ABSENCE', 'WILL_BE_RESCHEDULED'].includes(option.value))
  }
  res.locals.attendedCompliedProps = { forename, surname, appointment, outcomeItems }
  return next()
}
