import { SentenceType } from '../../data/model/sentenceDetails'
import { EnforcementActionCreatedByOption, EnforcementActionLetterTypeOption } from '../../models/Appointments'

export const breachNSICreatedByOptions = (sentenceType: SentenceType): EnforcementActionCreatedByOption[] => [
  { text: 'Case administrator', value: 'CASE_ADMIN', hint: { text: 'This will be added to the appointment notes.' } },
  { text: `I’ll initiate the ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'}`, value: 'USER' },
]

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
  { text: 'A different enforcement letter', value: 'DIFFERENT_ENFORCEMENT_LETTER' },
]
