import { isNotEmpty } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { AppointmentsValidationArgs } from './appointments'

interface AppointmentOutcomesValidationArgs extends AppointmentsValidationArgs {
  isInPast?: boolean
}

export const appointmentOutcomesValidation = (args: AppointmentOutcomesValidationArgs): ValidationSpec => {
  const { crn, id, page, isInPast } = args
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
      optional: page !== `outcome/attended-failed-to-comply`,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select an action for this failure to comply',
          log: 'Appointment enforcement action not selected',
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
