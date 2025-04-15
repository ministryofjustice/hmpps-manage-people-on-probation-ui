import {
  isNotEmpty,
  isNotLaterThan,
  isNotLaterThanToday,
  isValidDate,
  ValidationSpec,
  isValidDateFormat,
  isStringNumber,
  isNotLaterThanAYear,
} from '../../utils/validationUtils'

interface Args {
  crn: string
  id: string
  page: string
  validateSentenceRequirement?: boolean
  validateSentenceLicenceCondition?: boolean
}

export const appointmentsValidation = (args: Args): ValidationSpec => {
  const { crn, id, page, validateSentenceRequirement, validateSentenceLicenceCondition } = args
  return {
    [`[appointments][${crn}][${id}][type]`]: {
      optional: page !== 'type',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment type',
        },
      ],
    },
    [`[appointments][${crn}][${id}][sentence]`]: {
      optional: page !== 'sentence',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a sentence',
        },
      ],
    },
    [`[appointments][${crn}][${id}][sentence-requirement]`]: {
      optional: page !== 'sentence' || (page === 'sentence' && !validateSentenceRequirement),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a requirement',
        },
      ],
    },
    [`[appointments][${crn}][${id}][sentence-licence-condition]`]: {
      optional: page !== 'sentence' || (page === 'sentence' && !validateSentenceLicenceCondition),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a licence condition',
        },
      ],
    },
    [`[appointments][${crn}][${id}][location]`]: {
      optional: page !== 'location',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment location',
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
      ],
    },
    [`[appointments][${crn}][${id}][start-time]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment start time',
        },
      ],
    },
    [`[appointments][${crn}][${id}][end-time]`]: {
      optional: page !== 'datetime',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an appointment end time',
        },
      ],
    },
    [`[appointments][${crn}][${id}][repeating]`]: {
      optional: page !== 'repeating',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if the appointment will repeat',
        },
      ],
    },
    [`[appointments][${crn}][${id}][repeating-frequency]`]: {
      optional: page !== 'repeating',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select the frequency the appointment will repeat',
        },
      ],
    },
    [`[appointments][${crn}][${id}][repeating-count]`]: {
      optional: page !== 'repeating',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the number of times the appointment will repeat',
        },
        {
          validator: isStringNumber,
          msg: 'Enter a number',
        },
        {
          validator: isNotLaterThanAYear,
          msg: 'The appointment can only repeat up to a year',
        },
      ],
    },
  }
}
