import { AppointmentOutcomeType, AppointmentEnforcementAction } from '../../models/Appointments'

export interface PageAccessRule {
  url: string
  required?: PageAccessRuleItem
  oneRequired?: PageAccessRuleItem[]
}

export type AnyValueType = '*'

export interface PageAccessRuleItem {
  'outcome.outcomeType'?: AppointmentOutcomeType | AnyValueType
  'outcome.attendedFailedToComply'?: AppointmentEnforcementAction | AnyValueType
  'outcome.acceptableAbsence'?: AppointmentEnforcementAction | AnyValueType
  'outcome.unacceptableAbsence'?: AppointmentEnforcementAction | AnyValueType
  'outcome.failedToAttend'?: AppointmentEnforcementAction | AnyValueType
  'outcome.otherEnforcementAction'?: AppointmentEnforcementAction | AnyValueType
  'outcome.breachNSICreatedBy'?: AnyValueType
  'outcome.letterType'?: AnyValueType
  'outcome.nextAppointment'?: AnyValueType
  'outcome.updateEnforcementAction'?: AppointmentEnforcementAction | AnyValueType
  notes?: AnyValueType
  nextAppointment?: AnyValueType
}

export const anyValue: AnyValueType = '*'

const allValidOutcomeAndActionPaths: PageAccessRuleItem[] = [
  { 'outcome.outcomeType': 'ATTENDED_COMPLIED' },
  { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_SERVICE_ISSUES' },
  {
    'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
    'outcome.attendedFailedToComply': 'SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
    'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
    'outcome.breachNSICreatedBy': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
    'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
    'outcome.attendedFailedToComply': 'SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
    'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
    'outcome.breachNSICreatedBy': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
    'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
    'outcome.attendedFailedToComply': 'REFER_TO_OFFENDER_MANAGER',
  },
  { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': 'NO_FURTHER_ACTION' },
  {
    'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
    'outcome.attendedFailedToComply': 'DIFFERENT_ACTION',
    'outcome.otherEnforcementAction': anyValue,
  },
  { 'outcome.outcomeType': 'ACCEPTABLE_ABSENCE', 'outcome.acceptableAbsence': anyValue },
  {
    'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
    'outcome.unacceptableAbsence': 'SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
    'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED',
    'outcome.breachNSICreatedBy': anyValue,
  },
  {
    'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
    'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'REFER_TO_OFFENDER_MANAGER' },
  { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'NO_FURTHER_ACTION' },
  {
    'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
    'outcome.unacceptableAbsence': 'DIFFERENT_ACTION',
    'outcome.otherEnforcementAction': anyValue,
  },
  {
    'outcome.outcomeType': 'FAILED_TO_ATTEND',
    'outcome.failedToAttend': 'SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': 'FAILED_TO_ATTEND',
    'outcome.failedToAttend': 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
  },
  {
    'outcome.outcomeType': 'FAILED_TO_ATTEND',
    'outcome.failedToAttend': 'DIFFERENT_ACTION',
    'outcome.otherEnforcementAction': anyValue,
  },
  { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': 'REFER_TO_OFFENDER_MANAGER' },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': 'BREACH_RECALL_INITIATED',
    'outcome.breachNSICreatedBy': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': 'SEND_ANOTHER_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': 'SEND_LETTER',
    'outcome.letterType': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': 'DIFFERENT_ACTION',
    'outcome.otherEnforcementAction': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.otherEnforcementAction': anyValue,
  },
  {
    'outcome.outcomeType': anyValue,
    'outcome.updateEnforcementAction': anyValue,
  },
]

export const pageAccessRules: PageAccessRule[] = [
  {
    url: 'attended-failed-to-comply',
    oneRequired: [
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY' },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR' },
    ],
  },
  {
    url: 'acceptable-absence',
    required: { 'outcome.outcomeType': 'ACCEPTABLE_ABSENCE' },
  },
  {
    url: 'unacceptable-absence',
    required: { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE' },
  },
  {
    url: 'failed-to-attend',
    required: { 'outcome.outcomeType': 'FAILED_TO_ATTEND' },
  },
  {
    url: 'enforcement-action',
    oneRequired: [
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': 'DIFFERENT_ACTION' },
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': 'NO_FURTHER_ACTION' },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR', 'outcome.attendedFailedToComply': 'DIFFERENT_ACTION' },
      {
        'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
        'outcome.attendedFailedToComply': 'NO_FURTHER_ACTION',
      },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': anyValue },
      { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': anyValue },
      { 'outcome.outcomeType': anyValue, 'outcome.otherEnforcementAction': anyValue },
      { 'outcome.outcomeType': anyValue, 'outcome.updateEnforcementAction': anyValue },
    ],
  },
  {
    url: 'initiate-breach-or-recall',
    oneRequired: [
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.attendedFailedToComply': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED' },
      {
        'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
        'outcome.unacceptableAbsence': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
      {
        'outcome.outcomeType': anyValue,
        'outcome.updateEnforcementAction': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': anyValue,
        'outcome.updateEnforcementAction': 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.otherEnforcementAction': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
        'outcome.otherEnforcementAction': 'BREACH_RECALL_INITIATED',
      },
      {
        'outcome.outcomeType': 'FAILED_TO_ATTEND',
        'outcome.otherEnforcementAction': 'BREACH_RECALL_INITIATED',
      },
    ],
  },
  {
    url: 'send-letter',
    oneRequired: [
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.attendedFailedToComply': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': anyValue,
        'outcome.updateEnforcementAction': 'SEND_ANOTHER_LETTER',
      },
      {
        'outcome.outcomeType': anyValue,
        'outcome.updateEnforcementAction': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR',
        'outcome.attendedFailedToComply': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
        'outcome.unacceptableAbsence': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'FAILED_TO_ATTEND',
        'outcome.failedToAttend': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'FAILED_TO_ATTEND',
        'outcome.failedToAttend': 'SEND_LETTER',
      },
      {
        'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY',
        'outcome.otherEnforcementAction': anyValue,
      },

      {
        'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE',
        'outcome.otherEnforcementAction': anyValue,
      },

      {
        'outcome.outcomeType': 'FAILED_TO_ATTEND',
        'outcome.otherEnforcementAction': anyValue,
      },
    ],
  },
  {
    url: 'add-note',
    oneRequired: allValidOutcomeAndActionPaths,
  },
  {
    url: 'update-enforcement-action',
    oneRequired: [
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.attendedFailedToComply': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.letterType': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.otherEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_FAILED_TO_COMPLY', 'outcome.updateEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR', 'outcome.attendedFailedToComply': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR', 'outcome.letterType': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR', 'outcome.otherEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'ATTENDED_SENT_HOME_BEHAVIOUR', 'outcome.updateEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.unacceptableAbsence': anyValue },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.letterType': anyValue },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.otherEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'UNACCEPTABLE_ABSENCE', 'outcome.updateEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.failedToAttend': anyValue },
      { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.letterType': anyValue },
      { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.otherEnforcementAction': anyValue },
      { 'outcome.outcomeType': 'FAILED_TO_ATTEND', 'outcome.updateEnforcementAction': anyValue },
    ],
  },
  {
    url: 'next-appointment',
    required: { notes: anyValue },
    oneRequired: allValidOutcomeAndActionPaths,
  },
  {
    url: 'check-your-answers',
    oneRequired: [...allValidOutcomeAndActionPaths, { 'outcome.outcomeType': anyValue }],
  },
]
