import { Route } from '../../@types'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { failedToAttendOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getFailedToAttendOptions: Route<void> = (_req, res, next) => {
  const { forename, isProbationPractitioner, appointmentSession } = res.locals.appointmentOutcome
  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactOutcomes,
    failedToAttendOptions(forename),
  )
  if (isProbationPractitioner) {
    options = options.filter(option => option.value !== 'REFER_TO_OFFENDER_MANAGER')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
