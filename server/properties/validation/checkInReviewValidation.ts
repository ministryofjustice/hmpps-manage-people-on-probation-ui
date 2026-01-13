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
  return {
    [`[esupervision][${crn}][${id}][checkins][note]`]: {
      optional: page !== 'view',
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
          msg: 'Select yes if the person in the video is the correct person',
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
  }
}
