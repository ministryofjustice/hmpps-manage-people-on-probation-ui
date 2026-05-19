import { AppointmentEnforcementAction } from '../../models/Appointments'
import { Option } from '../../models/Option'

export const failedToAttendOptions = (name: string): Option<AppointmentEnforcementAction>[] => [
  {
    value: 'SEND_LETTER',
    text: 'Send a letter',
  },
  {
    value: 'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
    text: `Decision pending ${name}’s response`,
  },
  {
    value: 'REFER_TO_OFFENDER_MANAGER',
    text: 'Refer to offender manager',
    hint: {
      text: 'Notify the allocated probation practitioner so they can take action.',
    },
  },
  {
    divider: 'or',
  },
  {
    value: 'DIFFERENT_ACTION',
    text: 'I want to add a different action',
  },
]
