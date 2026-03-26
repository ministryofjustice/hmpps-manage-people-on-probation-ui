import { AppointmentOutcomeOption } from '../models/Appointments'

export const outcomeOptions: AppointmentOutcomeOption[] = [
  {
    value: 'ATTENDED',
    text: 'Attended',
  },
  {
    value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
    text: 'Attended but sent home due to their behaviour',
    hint: {
      text: 'For example, their behaviour was disruptive or they did not follow instructions. ',
    },
  },
  {
    value: 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES',
    text: 'Attended but sent home due to Probation Service issues',
    hint: {
      text: 'For example, the building was unexpectedly closed.',
    },
  },
  {
    value: 'ACCEPTABLE_ABSENCE',
    text: 'Acceptable absence',
    hint: {
      text: 'They provided an acceptable reason or evidence.',
    },
  },
  {
    value: 'UNACCEPTABLE_ABSENCE',
    text: 'Unacceptable absence',
    hint: {
      text: 'They did not provide suitable evidence.',
    },
  },
  {
    value: 'EVIDENCE_REQUESTED',
    text: 'I’m waiting for evidence before making a decision',
    hint: {
      text: 'You may still need to request and review evidence.',
    },
  },
  {
    value: 'WILL_BE_RESCHEDULED',
    text: 'The appointment will be rescheduled',
  },
]
