import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { enforcementActionMap } from '../../properties/appointment-outcomes'
import { Activity } from '../../data/model/schedule'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { AppointmentOutcomeProps, CurrentEnforcementAction, TagColour } from '../../models/Locals'
import { outcomeRedirectMap } from '../../properties/appointment-outcomes/outcome-redirect-map'
import { dateWithYear, toSentenceCase } from '../../utils'

type Map = { [K in AppointmentEnforcementAction]?: TagColour }

export const getCurrentEnforcementAction: Route<void> = (_req, res, next): void => {
  const { forename, baseOutcomeUrl, appointmentSession } = res.locals
    .appointmentOutcome as AppointmentOutcomeProps<Activity>
  let tagColour: TagColour = 'YELLOW'
  let currentEnforcementAction: CurrentEnforcementAction = null
  let evidenceDueDate: string = null
  let evidenceWarning: string = null
  const { enforcementAction = null, appointment } = res.locals.personAppointment

  if (enforcementAction) {
    const { description = '', responseByDate = null, code: actionCode } = enforcementAction
    let action: AppointmentEnforcementAction = null
    if (enforcementAction.code) {
      action =
        (Object.entries(enforcementActionMap).find(
          ([_key, { code }]) => code === enforcementAction.code,
        )?.[0] as AppointmentEnforcementAction) || null
    }

    if (responseByDate && actionCode !== 'NFA' && appointment?.didTheyComply === false) {
      evidenceDueDate = dateWithYear(responseByDate)
      const date = DateTime.fromISO(responseByDate).startOf('day')
      const today = DateTime.now().startOf('day')
      const daysBetween = Math.max(0, Math.ceil(date.diff(today, 'days').days))
      evidenceWarning = `${forename} has until ${DateTime.fromISO(responseByDate).toFormat('d MMMM')} to submit evidence (${daysBetween} day${daysBetween !== 1 ? 's' : ''} remaining)`
    }
    const map: Map = {
      NO_FURTHER_ACTION: 'GREEN',
      REFER_TO_OFFENDER_MANAGER: 'PURPLE',
      WITHDRAWAL_OF_WARNING: 'GREEN',
    }
    if (map?.[action]) {
      tagColour = map[action]
    }
    const outcomeType = appointmentSession?.outcome?.outcomeType
    const link = outcomeType ? outcomeRedirectMap(baseOutcomeUrl)?.[outcomeType] : baseOutcomeUrl
    currentEnforcementAction = {
      description: toSentenceCase(description),
      action,
      code: enforcementAction?.code,
      tagColour,
      link,
      evidenceDueDate,
      evidenceWarning,
    }
  }
  res.locals.appointmentOutcome.currentEnforcementAction = currentEnforcementAction
  return next()
}
