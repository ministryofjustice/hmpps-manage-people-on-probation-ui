
import { EnforcementActionCreatedBy } from '../../models/Appointments'
import { Option } from '../../models/Option'


export const letterSentByOptions: Option<EnforcementActionCreatedBy>[] = [
  {
    text: 'Case administrator',
    value: 'CASE_ADMIN',
    hint: { text: 'You need to follow your local process to request a letter.' },
  },
  { text: `I’ll send the letter`, value: 'USER' },
]