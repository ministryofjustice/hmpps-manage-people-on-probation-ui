import { SentenceType } from '../../data/model/sentenceDetails'
import { AppointmentEnforcementActionOption } from '../../models/Appointments'

export const updateEnforcementActionOptions = (sentenceType: SentenceType): AppointmentEnforcementActionOption[] => [
  { text: 'Send a letter', value: 'SEND_LETTER' },
  { text: 'Send another letter', value: 'SEND_ANOTHER_LETTER' },
  { text: `Initiate a ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'}`, value: 'BREACH_RECALL_INITIATED' },
  {
    text: `Initiate a ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'} and send a letter`,
    value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
  },
  { text: 'Withdraw warning letter', value: 'WITHDRAW_WARNING_LETTER' },
  { text: 'Breach requested', value: 'BREACH_REQUESTED' },
  { text: 'Breach confirmation sent', value: 'BREACH_CONFIRMATION_SENT' },
  { text: 'Breach letter sent', value: 'BREACH_LETTER_SENT' },
  { text: 'Breach request actioned', value: 'BREACH_REQUEST_ACTIONED' },
  { text: `No further action`, value: 'NO_FURTHER_ACTION' },
  {
    divider: 'or',
  },
  { text: `I want to add a different action`, value: 'DIFFERENT_ACTION' },
]
