import { AcceptableAbsenceOutcomeType } from '../../models/Appointments'
import { Option } from '../../models/Option'

export const acceptableAbsenceOptions: Option<AcceptableAbsenceOutcomeType>[] = [
  {
    value: 'ACCEPTABLE_ABSENCE_COURT_LEGAL',
    text: 'Court / legal',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_EMPLOYMENT',
    text: 'Employment',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE',
    text: 'Family / childcare',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    text: 'Holiday',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_MEDICAL',
    text: 'Medical',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_RELIGIOUS',
    text: 'Religious',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_RIC',
    text: 'RIC (remanded in custody)',
  },
  {
    value: 'ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION',
    text: 'Professional judgement decision',
  },
  {
    value: 'ACCEPTABLE_FAILURE',
    text: 'Acceptable failure - none in the following 12 months',
    hint: {
      text: 'There have been no failures to attend other appointments in the last 12 months.',
    },
  },
]
