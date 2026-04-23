import { SentenceType } from '../../data/model/sentenceDetails'
import { EnforcementActionCreatedByOption } from '../../models/Appointments'

export const breachNSICreatedByOptions = (sentenceType: SentenceType): EnforcementActionCreatedByOption[] => [
  { text: 'Case administrator', value: 'CASE_ADMIN', hint: { text: 'This will be added to the appointment notes.' } },
  { text: `I’ll initiate the ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'}`, value: 'USER' },
]
