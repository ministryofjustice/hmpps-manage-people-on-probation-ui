import { isNotEmpty } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { AppointmentsValidationArgs } from './appointments'

export interface AppointmentOutcomesValidationArgs extends AppointmentsValidationArgs {
  isInPast?: boolean
  msg?: string | string[]
  log?: string | string[]
  sendLetter?: boolean
}

export const appointmentOutcomesValidation = (args: AppointmentOutcomesValidationArgs): ValidationSpec => {
  const enforcementActionRoutes = [
    'outcome/attended-failed-to-comply',
    'outcome/acceptable-absence',
    'outcome/unacceptable-absence',
    'outcome/failed-to-attend',
    'outcome/enforcement-action',
  ]
  const { crn, id, page, isInPast, msg, log, sendLetter } = args
  const msgs = Array.isArray(msg) ? msg : [msg]
  const logs = Array.isArray(log) ? log : [log]
  return {
    [`[appointments][${crn}][${id}][outcome][type]`]: {
      optional: page !== `outcome/index`,
      checks: [
        {
          validator: isNotEmpty,
          msg: isInPast ? `Select an outcome for this appointment` : 'Select why they will not attend this appointment',
          log: 'Appointment outcome not selected',
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][enforcementAction]`]: {
      optional: !enforcementActionRoutes.includes(page),
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
        page !== 'outcome/initiate-breach-or-recall' || (page === 'outcome/initiate-breach-or-recall' && !sendLetter),
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[1],
          log: logs[1],
        },
      ],
    },
    [`[appointments][${crn}][${id}][outcome][letterType]`]: {
      optional:
        page !== 'outcome/initiate-breach-or-recall' || (page === 'outcome/initiate-breach-or-recall' && !sendLetter),
      checks: [
        {
          validator: isNotEmpty,
          msg: msgs[2],
          log: logs[2],
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
