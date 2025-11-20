import {
  contactPrefEmailCheck,
  contactPrefMobileCheck,
  isNotEmpty,
  isValidDate,
  isValidDateFormat,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface ESupervisionValidationArgs {
  crn: string
  id: string
  page: string
  checkInMobile?: string
  checkInEmail?: string
}

export const eSuperVisionValidation = (args: ESupervisionValidationArgs): ValidationSpec => {
  const { crn, id, page, checkInEmail, checkInMobile } = args
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
    [`[esupervision][${crn}][${id}][checkins][preferredComs]`]: {
      optional: page !== 'contact-preference',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select how the person wants us to send a link to the service',
          log: 'Select how to send service link, not selected',
        },
      ],
    },

    [`[esupervision][${crn}][${id}][checkins][checkInEmail]`]: {
      optional: (page === 'contact-preference' && checkInEmail.trim() !== '') || page !== 'contact-preference',
      checks: [
        {
          validator: contactPrefEmailCheck,
          msg: 'Enter an email address',
          log: 'Email not entered in check in process',
          crossField: `[esupervision][${crn}][${id}][checkins][preferredComs]`,
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][checkInMobile]`]: {
      optional: (page === 'contact-preference' && checkInMobile.trim() !== '') || page !== 'contact-preference',
      checks: [
        {
          validator: contactPrefMobileCheck,
          msg: 'Enter a mobile number',
          log: 'Mobile number not entered in check in process',
          crossField: `[esupervision][${crn}][${id}][checkins][preferredComs]`,
        },
      ],
    },
  }
}
