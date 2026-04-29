import { AppointmentEnforcementActionOption } from '../../models/Appointments'

export const failedToAttendOptions = (name: string): AppointmentEnforcementActionOption[] => [
  {
    value: 'SEND_LETTER',
    text: 'Send a letter',
  },
  {
    value: 'DECISION_PENDING',
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
