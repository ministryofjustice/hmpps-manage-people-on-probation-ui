import { Route } from '../../@types'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { attendedFailedToComplyOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getAttendedFailedToComplyOptions: Route<void> = (_req, res, next) => {
  if (!res.locals.appointmentOutcome) {
    return next()
  }
  const {
    sentence: { type },
    isProbationPractitioner,
    appointmentSession,
  } = res.locals.appointmentOutcome

  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession?.outcome?.contactOutcomes,
    attendedFailedToComplyOptions(type),
  )
  if (isProbationPractitioner) {
    options = options.filter(option => option.value !== 'REFER_TO_OFFENDER_MANAGER')
  }
  res.locals.appointmentOutcome.options = options
  return next()
}
