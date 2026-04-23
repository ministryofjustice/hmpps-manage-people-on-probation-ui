import { Route } from '../../@types'
import { breachNSICreatedByOptions } from '../../properties/appointment-outcomes'

export const getBreachNSICreatedByOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type },
  } = res.locals.appointmentOutcome
  const options = breachNSICreatedByOptions(type)
  res.locals.appointmentOutcome.options = options
  return next()
}
