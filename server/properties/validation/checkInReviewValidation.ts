import { isNotEmpty } from '../../utils/validationUtils'
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
  const sensitiveContactPages = ['notes', 'view', 'view-expired', 'expired']
  const noteRequiredPages = ['view', 'view-expired']
  return {
    [`[esupervision][${crn}][${id}][checkins][note]`]: {
      optional: !noteRequiredPages.includes(page),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter a note to add to the contact',
          log: 'Note verification not completed',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][manualIdCheck]`]: {
      optional: page !== 'identity',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if the person in the check in image is the right person',
          log: 'Manual identity verification not completed',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][missedCheckinComment]`]: {
      optional: page !== 'expired',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Enter the reason the person did not complete their checkin',
          log: 'Missed checkin note not completed',
        },
      ],
    },
    [`[esupervision][${crn}][${id}][checkins][sensitiveContact]`]: {
      optional: !sensitiveContactPages.includes(page),
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if this online check in includes sensitive information',
          log: 'Sensitive contact selection not completed',
        },
      ],
    },
  }
}
