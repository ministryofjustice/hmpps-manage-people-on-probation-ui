import { isNotEmpty, isNotLaterThan, isNotLaterThanToday, isValidDate } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export const activityLogValidation = (dateToIsEmpty = true, dateFromIsEmpty = true): ValidationSpec => ({
  dateFrom: {
    optional: dateToIsEmpty,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Enter or select a date from',
      },
      {
        validator: isValidDate,
        msg: 'Enter a date in the correct format, for example 17/5/2024',
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
        validator: isValidDate,
        msg: 'Enter a date in the correct format, for example 17/5/2024',
      },
      {
        validator: isNotLaterThan,
        crossField: 'dateFrom',
        msg: 'The date to must be on or after the date from',
      },
    ],
  },
})
