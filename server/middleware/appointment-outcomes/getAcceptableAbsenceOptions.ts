import { Route } from '../../@types'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { acceptableAbsenceOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getAcceptableAbsenceOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { length },
    appointmentSession,
  } = res.locals.appointmentOutcome

  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactEnforcementActions,
    acceptableAbsenceOptions,
  )
  if (length <= 24) {
    options = options.filter(option => option.value !== 'ACCEPTABLE_FAILURE')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
