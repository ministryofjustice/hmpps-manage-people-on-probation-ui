import { SentenceType } from '../../data/model/sentenceDetails'
import { EnforcementActionCreatedBy } from '../../models/Appointments'
import { Option } from '../../models/Option'

export const breachNSICreatedByOptions = (sentenceType: SentenceType): Option<EnforcementActionCreatedBy>[] => [
  { text: 'Case administrator', value: 'CASE_ADMIN', hint: { text: 'This will be added to the appointment notes.' } },
  { text: `I’ll initiate the ${sentenceType === 'COMMUNITY' ? 'breach' : 'recall'}`, value: 'USER' },
]
