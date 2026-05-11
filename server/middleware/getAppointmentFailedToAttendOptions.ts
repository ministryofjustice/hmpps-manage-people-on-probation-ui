import { Route } from '../@types'
import { failedToAttendOptions } from '../properties/appointment-outcomes'

export const getAppointmentFailedToAttendOptions: Route<void> = (_req, res, next) => {
  const { forename, isProbationPractitioner } = res.locals.appointmentOutcome
  let options = failedToAttendOptions(forename)
  if (isProbationPractitioner) {
    options = options.filter(option => option.value !== 'REFER_TO_OFFENDER_MANAGER')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
