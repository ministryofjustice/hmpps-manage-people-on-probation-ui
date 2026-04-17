import { Route } from '../@types'
import { outcomeOptions } from '../properties/outcomeOptions'

export const getAppointmentOutcomeOptions: Route<void> = (_req, res, next) => {
  const { isInPast, appointmentSession } = res.locals.appointmentOutcome
  let options = outcomeOptions
  if (isInPast && appointmentSession?.type && !['COPT', 'COVC', 'CODC'].includes(appointmentSession.type)) {
    options = outcomeOptions.filter(option => !['WILL_BE_RESCHEDULED'].includes(option.value))
  }
  if (isInPast && appointmentSession?.type && ['COPT', 'COVC', 'CODC'].includes(appointmentSession.type)) {
    options = outcomeOptions.filter(
      option =>
        !['WILL_BE_RESCHEDULED', 'ATTENDED_SENT_HOME_SERVICE_ISSUES', 'ATTENDED_SENT_HOME_BEHAVIOUR'].includes(
          option.value,
        ),
    )
  }
  if (!isInPast) {
    options = options.filter(option => ['ACCEPTABLE_ABSENCE', 'WILL_BE_RESCHEDULED'].includes(option.value))
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
