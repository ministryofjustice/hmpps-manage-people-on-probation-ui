import { AppointmentEnforcementAction } from '../../models/Appointments'
import { Option } from '../../models/Option'

export const enforcementActionOptions = (name: string): Option<AppointmentEnforcementAction | ''>[] => [
  {
    value: '',
    text: 'Select enforcement action',
  },
  {
    value: 'BREACH_REQUESTED',
    text: 'Breach requested',
  },
  {
    value: 'BREACH_RECALL_INITIATED',
    text: 'Breach/recall initiated',
  },
  {
    value: 'BREACH_CONFIRMATION_SENT',
    text: 'Breach confirmation sent',
  },
  {
    value: 'BREACH_LETTER_SENT',
    text: 'Breach letter sent',
  },
  {
    value: 'BREACH_REQUEST_ACTIONED',
    text: 'Breach request actioned',
  },
  {
    value: 'SEND_CONFIRMATION_OF_BREACH',
    text: 'Send confirmation of breach',
  },
  {
    value: 'RECALL_REQUESTED',
    text: 'Recall requested',
  },
  {
    value: 'IMMEDIATE_BREACH_OR_RECALL',
    text: 'Immediate breach or recall',
  },
  {
    value: 'FIRST_WARNING_LETTER_SENT',
    text: 'First warning letter sent',
  },
  {
    value: 'SECOND_WARNING_LETTER_SENT',
    text: 'Second warning letter sent',
  },
  {
    value: 'OTHER_ENFORCEMENT_LETTER_SENT',
    text: 'Other enforcement letter sent',
  },
  {
    value: 'LICENCE_COMPLIANCE_LETTER_SENT',
    text: 'Licence compliance letter sent',
  },
  {
    value: 'ENFORCEMENT_LETTER_REQUESTED',
    text: 'Enforcement letter requested',
  },
  {
    value: 'WITHDRAW_WARNING_LETTER',
    text: 'Withdraw warning letter',
  },
  {
    value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
    text: `Decision pending ${name}’s response`,
  },
  {
    value: 'REFER_TO_OFFENDER_MANAGER',
    text: 'Refer to offender manager',
  },
  {
    value: 'YOT_OM_NOTIFIED',
    text: 'YOT OM notified',
  },
  {
    value: 'NO_FURTHER_ACTION',
    text: 'No further action',
  },
  {
    value: 'WITHDRAWAL_OF_WARNING',
    text: 'Withdrawal of warning',
  },
]
