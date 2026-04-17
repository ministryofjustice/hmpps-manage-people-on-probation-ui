import { DateTime } from 'luxon'
import { Route } from '../@types'
import { Activity } from '../data/model/schedule'
import { AppointmentOutcomeEnforcementAction } from '../models/Locals'

export const getAppointmentOutcomeEvidenceBy: Route<void> = (req, res, next) => {
  const { appointment } = res.locals.appointmentOutcome
  let enforcementAction: AppointmentOutcomeEnforcementAction = null
  if ((appointment as Activity)?.enforcementAction?.responseByDate) {
    const {
      enforcementAction: { responseByDate: enforcementActionResponseByDate },
    } = appointment as Activity
    const dt = DateTime.fromISO(enforcementActionResponseByDate)
    const today = DateTime.now().startOf('day')
    const responseByDate = dt.toFormat('d LLLL')
    const responseByDays = Math.floor(dt.diff(today, 'days').days)
    enforcementAction = { responseByDate, responseByDays }
  }
  res.locals.appointmentOutcome.enforcementAction = enforcementAction
  return next()
}
