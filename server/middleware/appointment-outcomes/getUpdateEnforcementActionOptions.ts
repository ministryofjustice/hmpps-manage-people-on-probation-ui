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
    crn,
    id,
    sentence: { type: sentenceType },
    appointment: { acceptableAbsence },
    baseOutcomeUrl,
    appointmentSession,
    currentEnforcementAction,
  } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>

  if (!currentEnforcementAction?.action) {
    return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
  }

  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactOutcomes,
    updateEnforcementActionOptions(sentenceType),
  )

  let values: AppointmentEnforcementAction[] = []

  /* Letter related */

  if (
    letterEnforcementActions.includes(currentEnforcementAction?.action as LetterEnforcementAction) &&
    !acceptableAbsence
  ) {
    values = [
      'SEND_ANOTHER_LETTER',
      'BREACH_RECALL_INITIATED',
      'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'WITHDRAW_WARNING_LETTER',
    ]
  }

  /* Breach related */

  if (
    breachEnforcementActions.includes(currentEnforcementAction?.action as BreachEnforcementAction) &&
    !acceptableAbsence &&
    sentenceType === 'COMMUNITY'
  ) {
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
  if (pendingResponseActions.includes(currentEnforcementAction?.action) && !acceptableAbsence) {
    values = ['SEND_LETTER', 'BREACH_RECALL_INITIATED', 'BREACH_RECALL_INITIATED_AND_SEND_LETTER']
  }

  /* Recall related */

  const recallActions: AppointmentEnforcementAction[] = [
    'BREACH_RECALL_INITIATED',
    'RECALL_REQUESTED',
    'IMMEDIATE_BREACH_OR_RECALL',
  ]
  if (recallActions.includes(currentEnforcementAction?.action) && !acceptableAbsence && sentenceType === 'CUSTODY') {
    values = ['RECALL_REQUESTED', 'WITHDRAW_WARNING_LETTER']
  }

  /* Acceptable absence */

  if (acceptableAbsence) {
    values = ['WITHDRAW_WARNING_LETTER']
  }

  /* Any other enforcement action? */

  if (!values.length) {
    return res.redirect(`${baseOutcomeUrl}/enforcement-action`)
  }

  values = [...values, 'NO_FURTHER_ACTION', 'DIFFERENT_ACTION']
  options = options
    .filter(option => values.includes(option.value as AppointmentEnforcementAction) || option?.divider)
    .filter(option => option.value !== currentEnforcementAction?.action)
  res.locals.appointmentOutcome.options = options
  return next()
}
