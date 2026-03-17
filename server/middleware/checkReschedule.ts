import { DateTime } from 'luxon'
import { Route } from '../@types'
import { LocalParams } from '../models/Appointments'
import { getMinMaxDates } from '../utils/getMinMaxDates'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { HmppsAuthClient } from '../data'

export const checkReschedule = (_hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { params, body, query } = req
    if ((query?.change as string).includes('/reschedule')) {
      const { crn, id } = params
      const { back = '', change = '' } = query as Record<string, string>
      const { enablePastAppointments } = res.locals.flags
      const { _minDate, _maxDate } = getMinMaxDates()
      const warningMessages: Record<string, string> = {}
      const previousStartISO = req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment?.previousStart
      const previousEndISO = req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment?.previousEnd
      const { date, start, end } = body.appointments[crn][id]
      if (previousStartISO && previousEndISO && date && start && end) {
        const newStart = DateTime.fromFormat(`${date} ${start}`, 'd/M/yyyy HH:mm', { zone: 'Europe/London' })
        const newEnd = DateTime.fromFormat(`${date} ${end}`, 'd/M/yyyy HH:mm', { zone: 'Europe/London' })
        const previousStart = DateTime.fromISO(previousStartISO)
        const previousEnd = DateTime.fromISO(previousEndISO)
        if (newStart.toMillis() === previousStart.toMillis() && newEnd.toMillis() === previousEnd.toMillis()) {
          warningMessages.isSameRescheduledDate = `You have selected a date, start time and end time which is the same as the previous appointment.`
          const localParams: LocalParams = {
            crn,
            id,
            back,
            change,
            ...(!enablePastAppointments ? { _minDate } : {}),
            _maxDate,
            isInPast: appointmentDateIsInPast(req),
          }
          res.locals.warningMessages = warningMessages
          return res.render(`pages/arrange-appointment/location-date-time`, { warningMessages, ...localParams })
        }
      }
    }
    return next()
  }
}
