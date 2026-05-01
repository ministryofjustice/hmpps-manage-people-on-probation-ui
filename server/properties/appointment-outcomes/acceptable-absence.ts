import { AppointmentEnforcementActionOption } from '../../models/Appointments'

export const acceptableAbsenceOptions: AppointmentEnforcementActionOption[] = [
  {
    value: 'COURT_LEGAL',
    text: 'Court / legal',
  },
  {
    value: 'EMPLOYMENT',
    text: 'Employment',
  },
  {
    value: 'FAMILY_CHILDCARE',
    text: 'Family / childcare',
  },
  {
    value: 'HOLIDAY',
    text: 'Holiday',
  },
  {
    value: 'MEDICAL',
    text: 'Medical',
  },
  {
    value: 'RELIGIOUS',
    text: 'Religious',
  },
  {
    value: 'RIC',
    text: 'RIC (remanded in custody)',
  },
  {
    value: 'PROFESSIONAL_JUDGEMENT_DECISION',
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
