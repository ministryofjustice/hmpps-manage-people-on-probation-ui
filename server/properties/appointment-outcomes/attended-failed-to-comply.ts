// eslint-disable-next-line import/no-cycle
import { AppointmentEnforcementAction } from '../../models/Appointments'
import { Option } from '../../models/Option'
import { SentenceType } from '../../data/model/sentenceDetails'

export const attendedFailedToComplyOptions = (
  sentenceType: SentenceType = 'COMMUNITY',
): Option<AppointmentEnforcementAction>[] => [
  {
    value: 'SEND_LETTER',
    text: 'Send a letter',
  },
  {
    value: 'BREACH_RECALL_INITIATED',
    text: `Initiate a ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'}`,
  },
  {
    value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    text: `Initiate a ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'} and send a letter`,
  },
  {
    value: 'REFER_TO_OFFENDER_MANAGER',
    text: 'Refer to offender manager',
    hint: {
      text: 'Notify the allocated probation practitioner so they can take action.',
    },
  },
  {
    value: 'NO_FURTHER_ACTION',
    text: 'No further action',
  },
  {
    divider: 'or',
  },
  {
    value: 'DIFFERENT_ACTION',
    text: 'I want to add a different action',
  },
]
