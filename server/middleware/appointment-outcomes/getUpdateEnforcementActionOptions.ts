import { Route } from '../../@types'
import { Activity } from '../../data/model/schedule'
import {
  AppointmentEnforcementAction,
  BreachEnforcementAction,
  LetterEnforcementAction,
} from '../../models/Appointments'
import { AppointmentOutcomeProps } from '../../models/Locals'
import { updateEnforcementActionOptions } from '../../properties/appointment-outcomes'

export const getUpdateEnforcementActionOptions: Route<void> = (_req, res, next) => {
  const breachActions: BreachEnforcementAction[] = [
    'BREACH_REQUESTED',
    'BREACH_RECALL_INITIATED',
    'BREACH_CONFIRMATION_SENT',
    'BREACH_LETTER_SENT',
    'BREACH_REQUEST_ACTIONED',
    'SEND_CONFIRMATION_OF_BREACH',
    'RECALL_REQUESTED',
    'IMMEDIATE_BREACH_OR_RECALL',
    'NO_FURTHER_ACTION',
  ]
  const letterActions: LetterEnforcementAction[] = [
    'FIRST_WARNING_LETTER_SENT',
    'SECOND_WARNING_LETTER_SENT',
    'BREACH_LETTER_SENT',
    'OTHER_ENFORCEMENT_LETTER_SENT',
    'LICENCE_COMPLIANCE_LETTER_SENT',
    'ENFORCEMENT_LETTER_REQUESTED',
    'WITHDRAW_WARNING_LETTER',
  ]
  const {
    sentence: { type: sentenceType },
    appointment: { acceptableAbsence },
    currentEnforcementAction,
  } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
  let options = updateEnforcementActionOptions(sentenceType)
  let values: AppointmentEnforcementAction[] = []

  if (letterActions.includes(currentEnforcementAction.action as LetterEnforcementAction)) {
    values = ['SEND_ANOTHER_LETTER', 'BREACH_RECALL_INITIATED', 'WITHDRAW_WARNING_LETTER']
  }
  if (
    ['DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION', 'REFER_TO_OFFENDER_MANAGER'].includes(
      currentEnforcementAction.action,
    )
  ) {
    values = ['SEND_LETTER', 'BREACH_RECALL_INITIATED', 'BREACH_RECALL_INITIATED_AND_SEND_LETTER']
  }
  if (breachActions.includes(currentEnforcementAction.action as BreachEnforcementAction)) {
    values = ['BREACH_REQUESTED', 'BREACH_CONFIRMATION_SENT', 'BREACH_LETTER_SENT', 'BREACH_REQUEST_ACTIONED']
  }

  if (acceptableAbsence) {
    values = ['WITHDRAW_WARNING_LETTER']
  }
  values = [...values, 'NO_FURTHER_ACTION', 'DIFFERENT_ACTION']
  options = options.filter(option => values.includes(option.value) || option?.divider)
  res.locals.appointmentOutcome.options = options
  return next()
}
