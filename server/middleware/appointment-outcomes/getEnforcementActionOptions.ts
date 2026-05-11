import { Route } from '../../@types'
import { enforcementActionOptions } from '../../properties/appointment-outcomes'

export const getEnforcementActionOptions: Route<void> = (_req, res, next) => {
  const { forename } = res.locals.appointmentOutcome
  const options = enforcementActionOptions(forename)
  res.locals.appointmentOutcome.options = options
  return next()
}
