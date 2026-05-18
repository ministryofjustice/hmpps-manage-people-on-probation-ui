import { AppointmentOutcomeOption } from '../../models/Appointments'

export const outcomeOptions: AppointmentOutcomeOption[] = [
  {
    value: 'ATTENDED_COMPLIED',
    text: 'Attended - complied',
  },
  {
    value: 'ATTENDED_FAILED_TO_COMPLY',
    text: 'Attended - failed to comply',
    hint: {
      text: 'For example, they did not follow instructions.',
    },
  },
  {
    value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
    text: 'Attended - sent home (behaviour)',
    hint: {
      text: 'For example, their behaviour was disruptive.',
    },
  },
  {
    value: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
    text: 'Attended - sent home (service issues)',
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
    value: 'FAILED_TO_ATTEND',
    text: 'Failed to attend',
    hint: {
      text: 'You may still need to request and review evidence.',
    },
  },
  {
    value: 'WILL_BE_RESCHEDULED',
    text: 'The appointment will be rescheduled',
  },
]
