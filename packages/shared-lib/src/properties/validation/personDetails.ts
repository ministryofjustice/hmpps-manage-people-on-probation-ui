import {
  charsOrLess,
  isEmail,
  isNotEmpty,
  isNotLaterThan,
  isNotLaterThanToday,
  isNumeric,
  isUkPostcode,
  isValidDate,
  isValidMobileNumber,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { type Origin } from '../../data/model/personalDetails'

interface Props {
  phoneNumber?: string
  mobileNumber?: string
  emailAddress?: string
  editingMainAddress: boolean
  origin?: Origin
}

export const personDetailsValidation = ({
  phoneNumber = '',
  mobileNumber = '',
  emailAddress = '',
  editingMainAddress,
  origin,
}: Props): ValidationSpec => ({
  phoneNumber: {
    optional: editingMainAddress === false || !phoneNumber,
    checks: [
      {
        validator: isNumeric,
        msg: 'Enter a phone number in the correct format.',
      },
      {
        validator: charsOrLess,
        length: 35,
        msg: `Phone number must be 35 characters or less.`,
      },
    ],
  },
  mobileNumber: {
    optional:
      (editingMainAddress === false && origin !== 'appointments') || (origin !== 'appointments' && !mobileNumber),
    checks: [
      {
        validator: isValidMobileNumber,
        msg: 'Enter a mobile number in the correct format.',
      },
      {
        validator: charsOrLess,
        length: 35,
        msg: `Mobile number must be 35 characters or less.`,
      },
    ],
  },
  emailAddress: {
    optional: editingMainAddress === false || !emailAddress,
    checks: [
      {
        validator: isEmail,
        msg: 'Enter an email address in the correct format.',
      },
      {
        validator: charsOrLess,
        length: 254,
        msg: `Email address must be 254 characters or less.`,
      },
    ],
  },
  buildingName: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `Building name must be 35 characters or less.`,
      },
    ],
  },
  buildingNumber: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `House number must be 35 characters or less.`,
      },
    ],
  },
  streetName: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `Street name must be 35 characters or less.`,
      },
    ],
  },
  district: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `District must be 35 characters or less.`,
      },
    ],
  },
  town: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `Town or city must be 35 characters or less.`,
      },
    ],
  },
  county: {
    optional: true,
    checks: [
      {
        validator: charsOrLess,
        length: 35,
        msg: `County must be 35 characters or less.`,
      },
    ],
  },
  postcode: {
    optional: true,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Enter a postcode.',
      },
      {
        validator: isUkPostcode,
        msg: 'Enter a full UK postcode.',
      },
    ],
  },
  addressTypeCode: {
    optional: editingMainAddress === false,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Select an address type.',
      },
    ],
  },
  verified: {
    optional: editingMainAddress === false,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Select yes if the address is verified.',
      },
    ],
  },
  startDate: {
    optional: editingMainAddress === false,
    checks: [
      {
        validator: isNotEmpty,
        msg: 'Enter or select a start date.',
      },
      {
        validator: isValidDate,
        msg: 'Enter or select a start date.',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'Start date can not be later than today.',
      },
    ],
  },
  endDate: {
    optional: true,
    checks: [
      {
        validator: isValidDate,
        msg: 'Enter or select an end date.',
      },
      {
        validator: isNotLaterThanToday,
        msg: 'End date can not be later than today.',
      },
      {
        validator: isNotLaterThan,
        crossField: 'startDate',
        msg: 'End date can not be earlier than the start date.',
      },
    ],
  },
})
