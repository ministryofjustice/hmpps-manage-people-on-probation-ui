import { Route } from '../@types'
import { breachNSICreatedByOptions, letterSentByOptions, letterTypeOptions } from '../properties/appointment-outcomes'

export const getAppointmentInitiateBreachRecallOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type },
    appointmentSession,
  } = res.locals.appointmentOutcome
  const options = breachNSICreatedByOptions(type)
  res.locals.appointmentOutcome.options = options
  if (appointmentSession.outcome.enforcementAction === 'INITIATE_BREACH_RECALL_AND_SEND_LETTER') {
    res.locals.appointmentOutcome = {
      ...res.locals.appointmentOutcome,
      letterSentByOptions,
      letterTypeOptions,
    }
  }
  return next()
}
