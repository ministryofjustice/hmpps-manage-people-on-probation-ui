import { Route } from '../../@types'
import { Activity } from '../../data/model/schedule'
import {
  AppointmentEnforcementAction,
  BreachEnforcementAction,
  LetterEnforcementAction,
  breachEnforcementActions,
  letterEnforcementActions,
} from '../../models/Appointments'
import { AppointmentOutcomeProps } from '../../models/Locals'
import { updateEnforcementActionOptions } from '../../properties/appointment-outcomes'
import { validEnforcementActionOptions } from '../../utils'

export const getUpdateEnforcementActionOptions: Route<void> = (_req, res, next) => {
  const {
    sentence: { type: sentenceType },
    appointment: { acceptableAbsence },
    baseOutcomeUrl,
    appointmentSession,
    currentEnforcementAction,
  } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>

  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactEnforcementActions,
    updateEnforcementActionOptions(sentenceType),
  )

  let values: AppointmentEnforcementAction[] = []

  /* Letter related */

  if (letterEnforcementActions.includes(currentEnforcementAction.action as LetterEnforcementAction)) {
    values = [
      'SEND_ANOTHER_LETTER',
      'BREACH_RECALL_INITIATED',
      'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'WITHDRAW_WARNING_LETTER',
    ]
  }

  /* Breach related */

  if (breachEnforcementActions.includes(currentEnforcementAction.action as BreachEnforcementAction)) {
    values = [
      'BREACH_REQUESTED',
      'BREACH_CONFIRMATION_SENT',
      'BREACH_LETTER_SENT',
      'BREACH_REQUEST_ACTIONED',
      'WITHDRAW_WARNING_LETTER',
    ]
  }

  /* Decision pending response - specific behaviour */

  const pendingResponseActions: AppointmentEnforcementAction[] = [
    'DECISION_PENDING_RESPONSE',
    'REFER_TO_OFFENDER_MANAGER',
    'YOT_OM_NOTIFIED',
  ]
  if (pendingResponseActions.includes(currentEnforcementAction.action)) {
    values = ['SEND_LETTER', 'BREACH_RECALL_INITIATED', 'BREACH_RECALL_INITIATED_AND_SEND_LETTER']
  }

  /* Recall related */

  const recallActions: AppointmentEnforcementAction[] = [
    'BREACH_RECALL_INITIATED',
    'RECALL_REQUESTED',
    'IMMEDIATE_BREACH_OR_RECALL',
  ]
  if (recallActions.includes(currentEnforcementAction.action)) {
    values = ['RECALL_REQUESTED', 'WITHDRAW_WARNING_LETTER']
  }

  /* Other enforcement action */

  const otherAction: AppointmentEnforcementAction = 'NO_FURTHER_ACTION'
  if (currentEnforcementAction.action === otherAction) {
    return res.redirect(`${baseOutcomeUrl}/enforcement-action`)
  }

  /* Acceptable absence */

  if (acceptableAbsence) {
    values = ['WITHDRAW_WARNING_LETTER']
  }
  values = [...values, 'NO_FURTHER_ACTION', 'DIFFERENT_ACTION']
  options = options.filter(option => values.includes(option.value as AppointmentEnforcementAction) || option?.divider)
  res.locals.appointmentOutcome.options = options
  return next()
}
