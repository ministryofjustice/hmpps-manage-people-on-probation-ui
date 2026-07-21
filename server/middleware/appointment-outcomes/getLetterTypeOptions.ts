import { Route } from '../../@types'
import { letterTypeOptions } from '../../properties/appointment-outcomes/letter-type-options'

export const getLetterTypeOptions: Route<void> = (_req, res, next) => {
  const {
  } = res.locals.appointmentOutcome
  res.locals.appointmentOutcome.letterTypeOptions = letterTypeOptions
  return next()
}
