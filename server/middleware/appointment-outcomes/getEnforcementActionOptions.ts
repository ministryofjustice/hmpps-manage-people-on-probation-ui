import { Route } from '../../@types'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { enforcementActionOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getEnforcementActionOptions: Route<void> = (_req, res, next) => {
  const { forename, appointmentSession } = res.locals.appointmentOutcome
  const options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactEnforcementActions,
    enforcementActionOptions(forename),
  )
  res.locals.appointmentOutcome.options = options
  return next()
}
