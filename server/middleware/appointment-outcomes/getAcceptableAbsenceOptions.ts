import type { Route } from '../../@types'
import type { AcceptableAbsenceOutcomeType } from '../../models/Appointments'
import { acceptableAbsenceOptions } from '../../properties/appointment-outcomes'
import { validOutcomeOptions } from '../../utils'

export const getAcceptableAbsenceOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { length },
    appointmentSession,
  } = res.locals.appointmentOutcome

  let options = validOutcomeOptions<AcceptableAbsenceOutcomeType>(
    appointmentSession?.outcome?.contactOutcomes,
    acceptableAbsenceOptions,
  )
  if (length <= 24) {
    options = options.filter(option => option.value !== 'ACCEPTABLE_FAILURE')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
