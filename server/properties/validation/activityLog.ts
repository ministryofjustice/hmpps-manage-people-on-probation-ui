import {
  isNotEmpty,
  isNotLaterThan,
  isNotLaterThanToday,
  isValidDate,
  ValidationSpec,
  isValidDateFormat,
} from '../../utils/validationUtils'

export const activityLogValidation = (dateToIsEmpty: boolean, dateFromIsEmpty: boolean): ValidationSpec => ({
  dateFrom: {
    optional: dateToIsEmpty,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Enter or select a date from',
      },
      {
        validator: isValidDateFormat,
        msg: 'Enter a date in the correct format, for example 17/5/2024',
      },
      {
        validator: isValidDate,
        msg: 'Enter a real date',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'The date from must be today or in the past',
      },
    ],
  },
  dateTo: {
    optional: dateFromIsEmpty,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Enter or select a date to',
      },
      {
        validator: isValidDateFormat,
        msg: 'Enter a date in the correct format, for example 17/5/2024',
      },
      {
        validator: isValidDate,
        msg: 'Enter a real date',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'The date to must be today or in the past',
      },
      {
        validator: isNotLaterThan,
        crossField: 'dateFrom',
        msg: 'The date to must be on or after the date from',
      },
    ],
  },
})
