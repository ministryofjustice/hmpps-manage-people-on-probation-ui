import { EnforcementActionCreatedByOption, EnforcementActionLetterTypeOption } from '../../models/Appointments'

export const letterSentByOptions: EnforcementActionCreatedByOption[] = [
  {
    text: 'Case administrator',
    value: 'CASE_ADMIN',
    hint: { text: 'You need to follow your local process to request a letter.' },
  },
  { text: `I’ll send the letter`, value: 'USER' },
]

export const letterTypeOptions: EnforcementActionLetterTypeOption[] = [
  { text: 'Licence compliance letter', value: 'LICENCE_COMPLIANCE_LETTER' },
  { text: 'First warning letter', value: 'FIRST_WARNING_LETTER' },
  { text: 'Second warning letter', value: 'SECOND_WARNING_LETTER' },
  { text: 'Breach warning letter', value: 'BREACH_WARNING_LETTER' },
  { text: 'A different enforcement letter', value: 'DIFFERENT_ENFORCEMENT_LETTER' },
]
