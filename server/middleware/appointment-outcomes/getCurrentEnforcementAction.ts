import { Route } from '../../@types'
import { enforcementActionMap } from '../../properties/appointment-outcomes'
import { Activity } from '../../data/model/schedule'
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { AppointmentOutcomeProps, TagColour } from '../../models/Locals'

type Map = { [K in AppointmentEnforcementAction]?: TagColour }

export const getCurrentEnforcementAction: Route<void> = (_req, res, next): void => {
  const { appointment } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
  let action: AppointmentEnforcementAction
  let tagColour: TagColour = 'YELLOW'
  let text = ''
  if (appointment?.action) {
    text = appointment.action
    action =
      (Object.entries(enforcementActionMap).find(
        ([_key, { description }]) => description?.toLowerCase() === (appointment as Activity).action.toLowerCase(),
      )?.[0] as AppointmentEnforcementAction) || null
  }
  const map: Map = {
    NO_FURTHER_ACTION: 'GREEN',
    REFER_TO_OFFENDER_MANAGER: 'PURPLE',
    WITHDRAWAL_OF_WARNING: 'GREEN',
  }
  if (map?.[action]) {
    tagColour = map[action]
  }
  res.locals.appointmentOutcome.currentEnforcementAction = action ? { action, text, tagColour } : null
  return next()
}
