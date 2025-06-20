import {
  isNotEmpty,
  isValidDate,
  isValidDateFormat,
  isStringNumber,
  timeIsNotLaterThan,
  timeIsNotEarlierThan,
  isTodayOrLater,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface AppointmentsValidationArgs {
  crn: string
  id: string
  page: string
  validateSentenceRequirement?: boolean
  validateSentenceLicenceCondition?: boolean
  repeatingValue?: 'Yes' | 'No'
}

export const appointmentsValidation = (args: AppointmentsValidationArgs): ValidationSpec => {
  const { crn, id, page, validateSentenceRequirement, validateSentenceLicenceCondition, repeatingValue } = args
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
    [`[appointments][${crn}][${id}][sentence]`]: {
      optional: page !== 'sentence',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a sentence',
          log: 'Sentence not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][sentence-requirement]`]: {
      optional: page !== 'sentence' || (page === 'sentence' && !validateSentenceRequirement),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a requirement',
          log: 'Sentence requirement not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][sentence-licence-condition]`]: {
      optional: page !== 'sentence' || (page === 'sentence' && !validateSentenceLicenceCondition),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a licence condition',
          log: 'Sentence licence condition not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][location]`]: {
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
      ],
    },
    [`[appointments][${crn}][${id}][start-time]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a start time',
          log: 'Appointment start time not selected or entered',
        },
        {
          validator: timeIsNotEarlierThan,
          msg: 'The end time must be after the start time',
          log: 'The end time must be after the start time',
          crossField: `[appointments][${crn}][${id}][end-time]`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][end-time]`]: {
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
          crossField: `[appointments][${crn}][${id}][start-time]`,
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
    [`[appointments][${crn}][${id}][repeating-frequency]`]: {
      optional: page !== 'repeating' || (page === 'repeating' && repeatingValue !== 'Yes'),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select the frequency the appointment will repeat',
          log: 'Appointment repeat frequency not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][repeating-count]`]: {
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
  }
}
