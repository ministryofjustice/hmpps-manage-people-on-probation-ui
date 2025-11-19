import { isNotEmpty, isValidDate, isValidDateFormat } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface ESupervisionValidationArgs {
  crn: string
  id: string
  page: string
}

export const eSuperVisionValidation = (args: ESupervisionValidationArgs): ValidationSpec => {
  const { crn, id, page } = args
  return {
    [`[esupervision][${crn}][${id}][checkins][interval]`]: {
      optional: page !== 'date-frequency',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select how often you would like the person to check in',
          log: 'Checkin frequency not selected',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][date]`]: {
      optional: page !== 'date-frequency',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the date you would like the person to complete their first check in',
          log: 'Checkin date not entered',
        },
        {
          validator: isValidDateFormat,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Checkin date not entered in correct format',
        },
        {
          validator: isValidDate,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Checkin date is not valid',
        },
      ],
    },
  }
}
