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
    appointmentSession,
    currentEnforcementAction,
  } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>

  let options = validEnforcementActionOptions<AppointmentEnforcementAction>(
    appointmentSession.outcome.contactEnforcementActions,
    updateEnforcementActionOptions(sentenceType),
  )

  let values: AppointmentEnforcementAction[] = []

  if (letterEnforcementActions.includes(currentEnforcementAction.action as LetterEnforcementAction)) {
    values = ['SEND_ANOTHER_LETTER', 'BREACH_RECALL_INITIATED', 'WITHDRAW_WARNING_LETTER']
  }
  if (
    ['DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION', 'REFER_TO_OFFENDER_MANAGER'].includes(
      currentEnforcementAction.action,
    )
  ) {
    values = ['SEND_LETTER', 'BREACH_RECALL_INITIATED', 'BREACH_RECALL_INITIATED_AND_SEND_LETTER']
  }
  if (breachEnforcementActions.includes(currentEnforcementAction.action as BreachEnforcementAction)) {
    values = ['BREACH_REQUESTED', 'BREACH_CONFIRMATION_SENT', 'BREACH_LETTER_SENT', 'BREACH_REQUEST_ACTIONED']
  }

  if (acceptableAbsence) {
    values = ['WITHDRAW_WARNING_LETTER']
  }
  values = [...values, 'NO_FURTHER_ACTION', 'DIFFERENT_ACTION']
  options = options.filter(option => values.includes(option.value as AppointmentEnforcementAction) || option?.divider)
  res.locals.appointmentOutcome.options = options
  return next()
}
