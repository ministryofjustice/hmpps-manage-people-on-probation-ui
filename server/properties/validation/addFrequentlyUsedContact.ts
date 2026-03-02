import { isNotEmpty } from '../../utils/validationUtils'
import { ValidationSpec } from '../../models/Errors'

export const addFrequentlyUsedContactValidation = (): ValidationSpec => {
  return {
    contactType: {
      optional: false,
      checks: [
        {
          validator: isNotEmpty,
          msg: 'Select a contact',
          log: 'Contact type selection missing',
        },
      ],
    },
  }
}
