import { Route } from '../../@types'
import { enforcementActionMap } from '../../properties/appointment-outcomes'
import { Activity } from '../../data/model/schedule'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { AppointmentOutcomeProps, OutcomeCurrentEnforcementAction, TagColour } from '../../models/Locals'
import { outcomeRedirectMap } from '../../properties/appointment-outcomes/outcome-redirect-map'
import { dateWithYear } from '../../utils'

type Map = { [K in AppointmentEnforcementAction]?: TagColour }

export const getCurrentEnforcementAction: Route<void> = (_req, res, next): void => {
  const { baseOutcomeUrl, appointmentSession } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
  let tagColour: TagColour = 'YELLOW'
  let currentEnforcementAction: OutcomeCurrentEnforcementAction = null
  const { enforcementAction = null } = res.locals.personAppointment
  if (enforcementAction) {
    const { description = '', responseByDate = null } = enforcementAction
    let action: AppointmentEnforcementAction = null
    if (enforcementAction.code) {
      action =
        (Object.entries(enforcementActionMap).find(
          ([_key, { code }]) => code === enforcementAction.code,
        )?.[0] as AppointmentEnforcementAction) || null
    }
    const evidenceDueDate = responseByDate ? dateWithYear(responseByDate) : null
    const map: Map = {
      NO_FURTHER_ACTION: 'GREEN',
      REFER_TO_OFFENDER_MANAGER: 'PURPLE',
      WITHDRAWAL_OF_WARNING: 'GREEN',
    }
    if (map?.[action]) {
      tagColour = map[action]
    }
    const { outcomeType } = appointmentSession.outcome
    const link = outcomeType ? outcomeRedirectMap(baseOutcomeUrl)[outcomeType] : null
    currentEnforcementAction = { description, action, code: enforcementAction?.code, tagColour, link, evidenceDueDate }
  }
  res.locals.appointmentOutcome.currentEnforcementAction = currentEnforcementAction
  console.log(res.locals.appointmentOutcome.currentEnforcementAction)
  return next()
}
