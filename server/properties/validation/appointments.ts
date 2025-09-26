import {
  isNotEmpty,
  isValidDate,
  isValidDateFormat,
  isStringNumber,
  timeIsNotLaterThan,
  timeIsNowOrInFuture,
  isTodayOrLater,
  isNotEarlierThan,
  isValidCharCount,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface AppointmentsValidationArgs {
  crn: string
  id: string
  page: string
  repeatingValue?: 'Yes' | 'No'
  visor?: boolean
  contactId?: string
  notes?: string
  maxCharCount?: number
}

export const appointmentsValidation = (args: AppointmentsValidationArgs): ValidationSpec => {
  const { crn, id, page, visor, repeatingValue, notes, maxCharCount } = args
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
          msg: 'Select a sentence',
          log: 'Sentence not selected',
        },
      ],
    },

    [`[appointments][${crn}][${id}][user][locationCode]`]: {
      optional: page !== 'location',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment location',
          log: 'Location not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][date]`]: {
      optional: page !== 'datetime',
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
          validator: isTodayOrLater,
          msg: 'Date must be today or in the future',
          log: 'Date must be today or in the future',
        },
        {
          validator: isNotEarlierThan,
          msg: 'The date must not be later than 31/12/2199',
          log: 'The date must not be later than 31/12/2199',
          crossField: `_maxDate`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][start]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a start time',
          log: 'Appointment start time not selected or entered',
        },
        {
          validator: timeIsNowOrInFuture,
          msg: 'The start time must be now or in the future',
          log: 'The start time must be now or in the future',
          crossField: `[appointments][${crn}][${id}][date]`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][end]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an end time',
          log: 'Appointment end time not selected or entered',
        },
        {
          validator: timeIsNotLaterThan,
          msg: 'The end time must be after the start time',
          log: 'The end time must be after the start time',
          crossField: `[appointments][${crn}][${id}][start]`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][repeating]`]: {
      optional: page !== 'repeating',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if the appointment will repeat',
          log: 'Appointment repeat not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][interval]`]: {
      optional: page !== 'repeating' || (page === 'repeating' && repeatingValue !== 'Yes'),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select the frequency the appointment will repeat',
          log: 'Appointment repeat frequency not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][numberOfRepeatAppointments]`]: {
      optional: page !== 'repeating' || (page === 'repeating' && repeatingValue !== 'Yes'),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the number of times the appointment will repeat',
          log: 'Appointment repeat count not entered',
        },
        {
          validator: isStringNumber,
          msg: 'Enter a number',
          log: 'Appointment repeat count not entered in correct format',
        },
      ],
    },
    [`[appointments][${crn}][${id}][notes]`]: {
      optional: page !== 'supporting-information' || (page === 'supporting-information' && notes.trim() === ''),
      checks: [
        {
          validator: isValidCharCount,
          msg: `Note must be ${maxCharCount} characters or less`,
          log: `Note exceeds maximum character length`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][sensitivity]`]: {
      optional: page !== 'supporting-information',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if appointment includes sensitive information',
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
    notes: {
      optional: page !== 'add-note' || (page === 'add-note' && notes.trim() === ''),
      checks: [
        {
          validator: isValidCharCount,
          msg: `Note must be ${maxCharCount} characters or less`,
          log: `Note exceeds maximum character length`,
        },
      ],
    },
    sensitive: {
      optional: page !== 'add-note',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether or not the appointment note contains sensitive information',
          log: 'Sensitivity not selected',
        },
      ],
    },
    outcomeRecorded: {
      optional: page !== 'attended-complied',
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
