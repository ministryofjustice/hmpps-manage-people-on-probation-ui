import { Route } from '../@types'
import { attendedFailedToComplyOptions } from '../properties/appointment-outcomes'

export const getAppointmentAttendedFailedToComplyOptions: Route<void> = (_req, res, next) => {
  const { sentenceType, isProbationPractitioner } = res.locals.appointmentOutcome
  let options = attendedFailedToComplyOptions(sentenceType)
  if (isProbationPractitioner) {
    options = options.filter(option => option.value !== 'REFER_TO_OFFENDER_MANAGER')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
