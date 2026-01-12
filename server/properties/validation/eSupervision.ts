import {
  charsOrLess,
  contactPrefEmailCheck,
  contactPrefMobileCheck,
  isEmail,
  isFutureDate,
  isNotEmpty,
  isValidDate,
  isValidDateFormat,
  isValidMobileNumber,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface ESupervisionValidationArgs {
  crn: string
  id: string
  page: string
  checkInMobile?: string
  checkInEmail?: string
  editCheckInEmail?: string
  editCheckInMobile?: string
  change?: string
  stopCheckIn?: string
}

export const eSuperVisionValidation = (args: ESupervisionValidationArgs): ValidationSpec => {
  const { crn, id, page, checkInEmail, checkInMobile, editCheckInEmail, editCheckInMobile, change, stopCheckIn } = args
  return {
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
        {
          validator: isFutureDate,
          msg: 'The first online check in date must be in the future',
          log: 'First checkin date must be in the future',
        },
      ],
    },
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
    [`[esupervision][${crn}][${id}][checkins][preferredComs]`]: {
      optional: page !== 'contact-preference' || change !== 'main',
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
    [`[esupervision][${crn}][${id}][checkins][editCheckInMobile]`]: {
      optional: (page === 'edit-contact-preference' && !editCheckInMobile) || page !== 'edit-contact-preference',
      checks: [
        {
          validator: isValidMobileNumber,
          msg: 'Enter a mobile number in the correct format.',
          log: 'Mobile number not in correct format in check in process',
        },
        {
          validator: charsOrLess,
          length: 35,
          msg: `Mobile number must be 35 characters or less.`,
          log: 'Mobile number must be less than 35 chars, in check in process',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][editCheckInEmail]`]: {
      optional: (page === 'edit-contact-preference' && !editCheckInEmail) || page !== 'edit-contact-preference',
      checks: [
        {
          validator: isEmail,
          msg: 'Enter an email address in the correct format.',
          log: 'Email address not in correct format in check in process',
        },
        {
          validator: charsOrLess,
          length: 254,
          msg: `Email address must be 254 characters or less.`,
          log: 'Email address must be 254 characters or less in check in process',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][photoUploadOption]`]: {
      optional: page !== 'photo-options',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an option to continue',
          log: 'Photo option, not selected',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][manageCheckin][date]`]: {
      optional: page !== 'checkin-settings',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the date you would like the person to complete their next check in',
          log: 'Next checkin date not entered',
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
        {
          validator: isFutureDate,
          msg: 'The next online check in date must be in the future',
          log: 'Manage checkin date must be in the future',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][manageCheckin][editCheckInMobile]`]: {
      optional: (page === 'edit-contact' && !editCheckInMobile) || page !== 'edit-contact',
      checks: [
        {
          validator: isValidMobileNumber,
          msg: 'Enter a mobile number in the correct format.',
          log: 'Mobile number not in correct format in check in process',
        },
        {
          validator: charsOrLess,
          length: 35,
          msg: `Mobile number must be 35 characters or less.`,
          log: 'Mobile number must be less than 35 chars, in check in process',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][manageCheckin][editCheckInEmail]`]: {
      optional: (page === 'edit-contact' && !editCheckInEmail) || page !== 'edit-contact',
      checks: [
        {
          validator: isEmail,
          msg: 'Enter an email address in the correct format.',
          log: 'Email address not in correct format in check in process',
        },
        {
          validator: charsOrLess,
          length: 254,
          msg: `Email address must be 254 characters or less.`,
          log: 'Email address must be 254 characters or less in check in process',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][manageCheckin][stopCheckin]`]: {
      optional: page !== 'stop-checkin',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select yes if you want to stop check ins for the person',
          log: 'Stop checkin, not selected',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][manageCheckin][reason]`]: {
      optional: page !== `stop-checkin` || (page === 'stop-checkin' && stopCheckIn !== 'YES'),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the reason for stopping',
          log: 'Stop checkin, reason not provided',
        },
      ],
    },

    photoUpload: {
      optional: page !== 'upload-a-photo',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a photo of the person',
          log: 'Photo not selected.',
        },
      ],
    },
  }
}
