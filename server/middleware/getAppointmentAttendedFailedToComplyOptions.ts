import { Route } from '../@types'
import { attendedFailedToComplyOptions } from '../properties/appointment-outcomes'

export const getAppointmentAttendedFailedToComplyOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type },
    isProbationPractitioner,
  } = res.locals.appointmentOutcome
  let options = attendedFailedToComplyOptions(type)
  if (isProbationPractitioner) {
    options = options.filter(option => option.value !== 'REFER_TO_OFFENDER_MANAGER')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
