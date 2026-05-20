import { EnforcementActionCreatedBy, EnforcementActionLetterType } from '../../models/Appointments'
import { Option } from '../../models/Option'

export const letterSentByOptions: Option<EnforcementActionCreatedBy>[] = [
  {
    text: 'Case administrator',
    value: 'CASE_ADMIN',
    hint: { text: 'You need to follow your local process to request a letter.' },
  },
  { text: `I’ll send the letter`, value: 'USER' },
]

export const letterTypeOptions: Option<EnforcementActionLetterType>[] = [
  { text: 'Licence compliance letter', value: 'LICENCE_COMPLIANCE_LETTER_SENT' },
  { text: 'First warning letter', value: 'FIRST_WARNING_LETTER_SENT' },
  { text: 'Second warning letter', value: 'SECOND_WARNING_LETTER_SENT' },
  { text: 'Breach warning letter', value: 'BREACH_LETTER_SENT' },
  { text: 'A different enforcement letter', value: 'OTHER_ENFORCEMENT_LETTER_SENT' },
]
