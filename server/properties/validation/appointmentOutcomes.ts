import { isNotEmpty, isValidCharCount } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { AppointmentsValidationArgs } from './appointments'

export interface AppointmentOutcomesValidationArgs extends AppointmentsValidationArgs {
  isInPast?: boolean
  msg?: string | string[]
  log?: string | string[]
  sendBreachOrRecallLetter?: boolean
}

export const appointmentOutcomesValidation = (args: AppointmentOutcomesValidationArgs): ValidationSpec => {
  const { crn, id, page, isInPast, msg, log, sendBreachOrRecallLetter, notes, maxCharCount } = args
  const msgs = Array.isArray(msg) ? msg : [msg]
  const logs = Array.isArray(log) ? log : [log]
  return {
    [`[appointments][${crn}][${id}][outcome][outcomeType]`]: {
      optional: page !== `outcome/index`,
      checks: [
        {
          validator: isNotEmpty,
          msg: isInPast ? `Select an outcome for this appointment` : 'Select why they will not attend this appointment',
          log: 'Appointment outcome not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][attendedFailedToComply]`]: {
      optional: page !== 'outcome/attended-failed-to-comply',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][acceptableAbsence]`]: {
      optional: page !== 'outcome/acceptable-absence',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][unacceptableAbsence]`]: {
      optional: page !== 'outcome/unacceptable-absence',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][failedToAttend]`]: {
      optional: page !== 'outcome/failed-to-attend',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][otherEnforcementAction]`]: {
      optional: page !== 'outcome/enforcement-action',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][updateEnforcementAction]`]: {
      optional: page !== 'outcome/update-enforcement-action',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][breachNSICreatedBy]`]: {
      optional: page !== 'outcome/initiate-breach-or-recall',
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[0],
          log: logs[0],
        },
      ],
    },

    [`[appointments][${crn}][${id}][outcome][letterSentBy]`]: {
      optional:
        !['outcome/initiate-breach-or-recall', 'outcome/send-letter'].includes(page) ||
        (page === 'outcome/initiate-breach-or-recall' && !sendBreachOrRecallLetter),
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[page === 'outcome/initiate-breach-or-recall' ? 1 : 0],
          log: logs[page === 'outcome/initiate-breach-or-recall' ? 1 : 0],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][letterType]`]: {
      optional:
        !['outcome/initiate-breach-or-recall', 'outcome/send-letter'].includes(page) ||
        (page === 'outcome/initiate-breach-or-recall' && !sendBreachOrRecallLetter),
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[page === 'outcome/initiate-breach-or-recall' ? 2 : 1],
          log: logs[page === 'outcome/initiate-breach-or-recall' ? 2 : 1],
        },
      ],
    },
    [`[appointments][${crn}][${id}][notes]`]: {
      optional: page !== `outcome/add-note` || (page === `outcome/add-note` && notes?.trim() === ''),
      checks: [
        {
          validator: isValidCharCount,
          msg: `Note must be ${maxCharCount} characters or less`,
          log: `Note exceeds maximum character length`,
        },
      ],
    },
    [`[appointments][${crn}][${id}][sensitivity]`]: {
      optional: page !== `outcome/add-note`,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select whether or not the appointment note contains sensitive information',
          log: 'Sensitivity not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][nextAppointment]`]: {
      optional: page !== 'outcome/next-appointment',
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select if you want to arrange the next appointment',
          log: 'Next appointment type not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][complied]`]: {
      optional: page !== `outcome/attended-complied`,
      checks: [
        {
          validator: isNotEmpty,
          msg: `Select if they attended and complied`,
          log: 'Attended and complied not selected',
        },
      ],
    },
  }
}
