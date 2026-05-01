import { isNotEmpty } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { AppointmentsValidationArgs } from './appointments'

interface AppointmentOutcomesValidationArgs extends AppointmentsValidationArgs {
  isInPast?: boolean
  msg?: string
  log?: string
}

export const appointmentOutcomesValidation = (args: AppointmentOutcomesValidationArgs): ValidationSpec => {
  const enforcementActionRoutes = [
    'outcome/attended-failed-to-comply',
    'outcome/acceptable-absence',
    'outcome/unacceptable-absence',
    'outcome/failed-to-attend',
    'outcome/enforcement-action',
  ]
  const { crn, id, page, isInPast, msg, log } = args
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
          msg,
          log,
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
