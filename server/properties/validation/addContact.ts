import { isNotEmpty, isValidDate, isValidDateFormat, timeIsValid24HourFormat } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export const addContactValidation = (): ValidationSpec => {
  return {
    sentence: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select what the contact is related to',
          log: 'Contact sentence not selected',
        },
      ],
    },
    date: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter a date',
          log: 'Contact date not entered',
        },
        {
          validator: isValidDateFormat,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Contact date format invalid',
        },
        {
          validator: isValidDate,
          msg: 'Enter a date in the correct format, for example 17/5/2024',
          log: 'Contact date invalid',
        },
      ],
    },
    time: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter a time in the 24-hour format, for example 16:30',
          log: 'Contact time not entered',
        },
        {
          validator: timeIsValid24HourFormat,
          msg: 'Enter a time in the 24-hour format, for example 16:30',
          log: 'Contact time format invalid',
          crossField: 'date',
        },
      ],
    },
    visor: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if the contact should be included in the ViSOR report',
          log: 'ViSOR selection not made',
        },
      ],
    },
    sensitivity: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if the contact includes sensitive information',
          log: 'Sensitivity selection not made',
        },
      ],
    },
  }
}
