const ruleKeys = [
  'isInvalid',
  'isEmpty',
  'isMoreThanAYear',
  'isNotReal',
  'isIncomplete',
  'isInFuture',
  'isAfterTo',
  'isBeforeFrom',
] as const
const appointmentsKeys = [
  'type',
  'sentence',
  'sentence-requirement',
  'sentence-licence-condition',
  'location',
  'date',
  'start-time',
  'end-time',
  'repeating',
  'repeating-frequency',
  'repeating-count',
] as const
type Rule = (typeof ruleKeys)[number]
type AppointmentInput = (typeof appointmentsKeys)[number]

const activityLogKeys = ['date-from', 'date-to']
type ActivityLogInput = (typeof activityLogKeys)[number]

interface ErrorMessages {
  appointments: {
    [key in AppointmentInput]: {
      log: string
      errors: {
        [ruleKey in Rule]?: string
      }
    }
  }
}

export const errorMessages: ErrorMessages = {
  appointments: {
    type: {
      log: 'Appointment type not selected',
      errors: {
        isEmpty: 'Select an appointment type',
      },
    },
    sentence: {
      log: 'Sentence not selected',
      errors: {
        isEmpty: 'Select a sentence',
      },
    },
    'sentence-requirement': {
      log: 'Sentence requirement no selected',
      errors: {
        isEmpty: 'Select a requirement',
      },
    },
    'sentence-licence-condition': {
      log: 'Sentence licence condition no selected',
      errors: {
        isEmpty: 'Select a licence condition',
      },
    },
    location: {
      log: 'Location not selected',
      errors: {
        isEmpty: 'Select an appointment location',
      },
    },
    date: {
      log: 'Appointment date not selected',
      errors: {
        isEmpty: 'Select an appointment date',
      },
    },
    'start-time': {
      log: 'Appointment start time not selected',
      errors: {
        isEmpty: 'Select an appointment start time',
      },
    },
    'end-time': {
      log: 'Appointment end time not selected',
      errors: {
        isEmpty: 'Select an appointment end time',
      },
    },
    repeating: {
      log: 'Appointment repeating not selected',
      errors: {
        isEmpty: 'Select if the appointment will repeat',
      },
    },
    'repeating-frequency': {
      log: 'Appointment repeating frequency not selected',
      errors: {
        isEmpty: 'Select the frequency the appointment will repeat',
        isMoreThanAYear: 'The appointment can only repeat up to a year',
      },
    },
    'repeating-count': {
      log: 'Appointment repeating count not entered',
      errors: {
        isEmpty: 'Enter the number of times the appointment will repeat',
        isInvalid: 'Enter a number',
        isMoreThanAYear: 'The appointment can only repeat up to a year',
      },
    },
  },
}
