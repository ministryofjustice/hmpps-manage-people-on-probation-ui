import { isNotEmpty, isValidDate, ValidationSpec, isValidDateFormat, isStringNumber } from '../../utils/validationUtils'

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
          msg: 'Select an appointment date',
        },
        {
          validator: isValidDateFormat,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Appointment date not entered in correct format',
        },
        {
          validator: isValidDate,
          msg: 'Enter a real date',
          log: 'Appointment date is not valid',
        },
      ],
    },
    [`[appointments][${crn}][${id}][start-time]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment start time',
          log: 'Appointment start time not selected or entered',
        },
      ],
    },
    [`[appointments][${crn}][${id}][end-time]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment end time',
          log: 'Appointment end time not selected or entered',
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
