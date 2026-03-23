import { isNotEmpty } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'
import { AppointmentsValidationArgs } from './appointments'

export const appointmentOutcomesValidation = (args: AppointmentsValidationArgs): ValidationSpec => {
  const { crn, id, page } = args
  return {
    [`[appointments][${crn}][${id}][outcome]`]: {
      optional: page !== `arrange-appointment/${id}/attended-complied`,
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
