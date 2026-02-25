import {
  isNotEmpty,
  isValidDate,
  isValidDateFormat,
  isStringNumber,
  timeIsNotLaterThan,
  isNotEarlierThan,
  isValidCharCount,
  timeIsValid24HourFormat,
  isTodayOrLater,
  timeIsNowOrInFuture,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface AppointmentsValidationArgs {
  crn: string
  id: string
  page: string
  visor?: boolean
  contactId?: string
  notes?: string
  maxCharCount?: number
  enablePastAppointments?: boolean
  fileOrNote?: boolean
}

export const appointmentsValidation = (args: AppointmentsValidationArgs): ValidationSpec => {
  const { crn, id, contactId, page, visor, notes, maxCharCount, enablePastAppointments } = args
  return {
    [`[appointments][${crn}][${id}][type]`]: {
      optional: page !== 'type',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment type',
          log: 'Appointment type not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][visorReport]`]: {
      optional: page !== 'type' || !visor,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if appointment should be included in ViSOR report',
          log: 'VISOR report not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][eventId]`]: {
      optional: page !== 'sentence',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select what this appointment is for',
          log: 'Sentence not selected',
        },
      ],
    },

    [`[appointments][${crn}][${id}][date]`]: {
      optional: page !== 'location-date-time',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter or select a date',
        },
        {
          validator: isValidDateFormat,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Appointment date not entered in correct format',
        },
        {
          validator: isValidDate,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Appointment date is not valid',
        },
        {
          validator: isNotEarlierThan,
          msg: 'The date must not be later than 31/12/2199',
          log: 'The date must not be later than 31/12/2199',
          crossField: `_maxDate`,
        },
        ...(!enablePastAppointments
          ? [
              {
                validator: isTodayOrLater,
                msg: 'Date must be today or in the future',
                log: 'Date must be today or in the future',
              },
            ]
          : []),
      ],
    },
    [`[appointments][${crn}][${id}][start]`]: {
      optional: page !== 'location-date-time',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter a start time',
          log: 'Appointment start time not selected or entered',
        },
        {
          validator: timeIsValid24HourFormat,
          msg: 'Enter a time in the 24-hour format, for example 16:30',
          log: 'Enter a time in the 24-hour format, for example 16:30',
          crossField: `[appointments][${crn}][${id}][date]`,
        },
        ...(!enablePastAppointments
          ? [
              {
                validator: timeIsNowOrInFuture,
                msg: 'The start time must be now or in the future',
                log: 'The start time must be now or in the future',
                crossField: `[appointments][${crn}][${id}][date]`,
              },
            ]
          : []),
      ],
    },
    [`[appointments][${crn}][${id}][end]`]: {
      optional: page !== 'location-date-time',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter an end time',
          log: 'Appointment end time not selected or entered',
        },
        {
          validator: timeIsValid24HourFormat,
          msg: 'Enter a time in the 24-hour format, for example 16:30',
          log: 'Enter a time in the 24-hour format, for example 16:30',
          crossField: `[appointments][${crn}][${id}][date]`,
        },
        {
          validator: timeIsNotLaterThan,
          msg: 'The end time must be after the start time',
          log: 'The end time must be after the start time',
          crossField: `[appointments][${crn}][${id}][start]`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][user][locationCode]`]: {
      optional: page !== 'location-date-time',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment location',
          log: 'Location not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][notes]`]: {
      optional:
        !['supporting-information', `arrange-appointment/${id}/add-note`].includes(page) ||
        (!['supporting-information', `arrange-appointment/${id}/add-note`].includes(page) && notes?.trim() === ''),
      checks: [
        {
          validator: isValidCharCount,
          msg: `Note must be ${maxCharCount} characters or less`,
          log: `Note exceeds maximum character length`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][sensitivity]`]: {
      optional: !['supporting-information', `arrange-appointment/${id}/add-note`].includes(page),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether or not the appointment note contains sensitive information',
          log: 'Sensitivity not selected',
        },
      ],
    },
    'appointment-id': {
      optional: page !== 'record-an-outcome',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Which appointment are you recording an outcome for?',
          log: 'Appointment not selected',
        },
      ],
    },
    nextAppointment: {
      optional: page !== 'next-appointment',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether or not you wanted to arrange the next appointment',
          log: 'Next appointment type not selected',
        },
      ],
    },
    fileOrNote: {
      optional: page !== `appointment/${contactId}/add-note`,
      checks: [
        {
          validator: isNotEmpty,
          msg: `Add a note or upload a file to continue`,
          log: `No content included for appointment patch`,
        },
      ],
    },
    notes: {
      optional:
        page !== `appointment/${contactId}/add-note` ||
        (page === `appointment/${contactId}/add-note` && notes?.trim() === ''),
      checks: [
        {
          validator: isValidCharCount,
          msg: `Note must be ${maxCharCount} characters or less`,
          log: `Note exceeds maximum character length`,
        },
      ],
    },
    sensitivity: {
      optional: page !== `appointment/${contactId}/add-note`,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether or not the appointment note contains sensitive information',
          log: 'Sensitivity not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcomeRecorded]`]: {
      optional: page !== `arrange-appointment/${id}/attended-complied`,
      checks: [
        {
          validator: isNotEmpty,
          msg: `Select if they attended and complied`,
          log: 'Attended and complied not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][rescheduleAppointment][whoNeedsToReschedule]`]: {
      optional: page !== 'reschedule-appointment',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select who is rescheduling this appointment',
          log: 'Select who is rescheduling this appointment not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][rescheduleAppointment][reason]`]: {
      optional: page !== 'reschedule-appointment',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Explain why this appointment is being rescheduled',
          log: 'Explain why this appointment is being rescheduled not provided',
        },
      ],
    },
    [`[appointments][${crn}][${id}][rescheduleAppointment][sensitivity]`]: {
      optional: page !== 'reschedule-appointment',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Explain if appointment includes sensitive information',
          log: 'Sensitivity not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][smsOptIn]`]: {
      optional: page !== 'text-message-confirmation',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if you want to send a text message confirmation',
          log: 'Send text message confirmation not selected',
        },
      ],
    },
    outcomeRecorded: {
      optional: page !== `appointment/${contactId}/attended-complied`,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if they attended and complied',
          log: 'Attended and complied not selected',
        },
      ],
    },
  }
}
