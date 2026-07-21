import { Route } from '../../@types'
import { letterSentByOptions } from '../../properties/appointment-outcomes/letter-sent-by-options'

export const getLetterSentByOptions: Route<void> = (_req, res, next) => {
  const {
  } = res.locals.appointmentOutcome
  res.locals.appointmentOutcome.letterSentByOptions = letterSentByOptions
  return next()
}
