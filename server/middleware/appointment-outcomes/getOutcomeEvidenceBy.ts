import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { AppointmentOutcomeEnforcementAction } from '../../models/Locals'

export const getOutcomeEvidenceBy: Route<void> = (req, res, next) => {
  const { appointmentSession } = res.locals.appointmentOutcome
  const enforcementActionResponseByDate = appointmentSession?.enforcementAction?.responseByDate ?? null
  let enforcementAction: AppointmentOutcomeEnforcementAction = null
  if (enforcementActionResponseByDate) {
    const dt = DateTime.fromISO(enforcementActionResponseByDate)
    const today = DateTime.now().startOf('day')
    const responseByDate = dt.toFormat('d LLLL')
    const responseByDays = Math.floor(dt.diff(today, 'days').days)
    enforcementAction = { responseByDate, responseByDays }
  }
  res.locals.appointmentOutcome.enforcementAction = enforcementAction
  return next()
}
