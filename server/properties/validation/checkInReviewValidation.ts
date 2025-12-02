import {
  charsOrLess,
  contactPrefEmailCheck,
  contactPrefMobileCheck,
  isEmail,
  isNotEmpty,
  isNumeric,
  isValidDate,
  isValidDateFormat,
} from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export interface CheckInReviewValidationArgs {
  crn: string
  id: string
  page: string
  manualId?: string
  missingNote?: string
  managementHelped?: string
}

export const checkInReviewValidation = (args: CheckInReviewValidationArgs): ValidationSpec => {
  const { crn, id, page } = args
  return {
    [`[esupervision][${crn}][${id}][checkins][manualIdCheck]`]: {
      optional: page !== 'identity',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether the snapshot matches the offender',
          log: 'Manual identity verification not completed',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][helpedManage]`]: {
      optional: page !== 'notes',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether the system improved risk management',
          log: 'System review not completed',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][note]`]: {
      optional: page !== 'expired',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter a reason why the offender did not attend the checkin',
          log: 'Missed checkin note not completed',
        },
      ],
    },
  }
}
