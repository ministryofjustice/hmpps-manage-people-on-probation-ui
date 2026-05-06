import { AppointmentEnforcementActionOption } from '../../models/Appointments'

export const enforcementActionOptions = (name: string): AppointmentEnforcementActionOption[] => [
  { text: 'Select enforcement action', value: '' },
  { text: 'Breach requested', value: 'BREACH_REQUESTED' },
  { text: 'Breach/recall initiated', value: 'BREACH_RECALL_INITIATED' },
  { text: 'Breach confirmation sent', value: 'BREACH_CONFIRMATION_SENT' },
  { text: 'Breach letter sent', value: 'BREACH_LETTER_SENT' },
  { text: 'Breach request actioned', value: 'BREACH_REQUEST_ACTIONED' },
  { text: 'Send confirmation of breach', value: 'SEND_CONFIRMATION_OF_BREACH' },
  { text: 'Recall requested', value: 'RECALL_REQUESTED' },
  { text: 'Immediate breach or recall', value: 'IMMEDIATE_BREACH_OR_RECALL' },
  { text: 'First warning letter sent', value: 'FIRST_WARNING_LETTER_SENT' },
  { text: 'Second warning letter sent', value: 'SECOND_WARNING_LETTER_SENT' },
  { text: 'Other enforcement letter sent', value: 'OTHER_ENFORCEMENT_LETTER_SENT' },
  { text: 'Licence compliance letter sent', value: 'LICENCE_COMPLIANCE_LETTER_SENT' },
  { text: 'Enforcement letter requested', value: 'ENFORCEMENT_LETTER_REQUESTED' },
  { text: 'Withdraw warning letter', value: 'WITHDRAW_WARNING_LETTER' },
  { text: `Decision pending ${name}’s response`, value: 'DECISION_PENDING_RESPONSE' },
  { text: `Refer to offender manager`, value: 'REFER_TO_OFFENDER_MANAGER' },
  { text: `YOT OM notified`, value: 'YOT_OM_NOTIFIED' },
  { text: `No further action`, value: 'NO_FURTHER_ACTION' },
  { text: `Withdrawal of warning`, value: 'WITHDRAWAL_OF_WARNING' },
]
