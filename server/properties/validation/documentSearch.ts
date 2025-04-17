import {
  isNotEarlierThan,
  isNotLaterThan,
  isNotLaterThanToday,
  isValidDate,
  ValidationSpec,
} from '../../utils/validationUtils'

export const documentSearchValidation = (): ValidationSpec => ({
  fileName: {
    optional: true,
    checks: [],
  },
  dateFrom: {
    optional: true,
    mandatoryWhenFieldSet: 'dateTo',
    mandatoryMsg: 'Enter or select a from date',
    checks: [
      {
        validator: isValidDate,
        msg: 'Enter a from date in the correct format, for example 17/5/2024',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'The from date must be today or in the past',
      },
      {
        validator: isNotEarlierThan,
        crossField: 'dateTo',
        msg: 'The from date must be on or before the to date',
      },
    ],
  },
  dateTo: {
    optional: true,
    mandatoryWhenFieldSet: 'dateFrom',
    mandatoryMsg: 'Enter or select a to date',
    checks: [
      {
        validator: isValidDate,
        msg: 'Enter a to date in the correct format, for example 17/5/2024',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'The to date must be today or in the past',
      },
      {
        validator: isNotLaterThan,
        crossField: 'dateFrom',
        msg: 'The to date must be on or after the from date',
      },
    ],
  },
})
