import { Route } from '../../@types'
import { acceptableAbsenceOptions } from '../../properties/appointment-outcomes'

export const getAcceptableAbsenceOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { length },
  } = res.locals.appointmentOutcome
  let options = acceptableAbsenceOptions
  if (length <= 24) {
    options = options.filter(option => option.value !== 'ACCEPTABLE_FAILURE')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
