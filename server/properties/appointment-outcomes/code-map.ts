import { AppointmentEnforcementAction, AppointmentOutcomeType, EnforcementActionPage } from '../../models/Appointments'

export type OutcomeMap = {
  [K in AppointmentOutcomeType]?: {
    code: OutcomeCode
    description?: string
    options?: AppointmentEnforcementAction[]
    pageKey?: EnforcementActionPage
  }
}

export type EnforcementActionMap = {
  [K in AppointmentEnforcementAction]?: {
    code: EnforcementActionCode
    description?: string
  }
}

export type EnforcementActionCode =
  | 'IBR'
  | 'ROM'
  | 'NFA'
  | 'EA12'
  | 'LCL'
  | 'EA02'
  | 'EA03'
  | 'EA08'
  | 'EA05'
  | 'BRE'
  | 'EA09'
  | 'EA10'
  | 'EA11'
  | 'IMB'
  | 'WLS'
  | 'EA06'
  | 'EA13'
  | 'EA07'
  | 'AACL'
  | 'AAEM'
  | 'AAFC'
  | 'AAHO'
  | 'AAME'
  | 'AARC'
  | 'AARE'
  | 'CO05'
  | 'EM01'
  | 'C173'

export type OutcomeCode = 'ATTC' | 'AFTC' | 'ATSH' | 'AFDA' | 'AAM11' | 'UAAB' | 'AFTA'

export const outcomeMap: OutcomeMap = {
  ATTENDED_COMPLIED: { code: 'ATTC', description: 'Attended - Complied' },
  ATTENDED_FAILED_TO_COMPLY: {
    code: 'AFTC',
    description: 'Attended - Failed To Comply',
  },
  ATTENDED_SENT_HOME_BEHAVIOUR: {
    code: 'ATSH',
    description: 'Attended - Sent Home (behaviour)',
  },
  ATTENDED_SENT_HOME_SERVICE_ISSUES: {
    code: 'AFDA',
    description: 'Attended - FTC Deemed Acceptable',
  },
  ACCEPTABLE_ABSENCE: {
    code: 'AAM11',
    description: 'Acceptable - Critical  Communications - no breach',
  },
  UNACCEPTABLE_ABSENCE: {
    code: 'UAAB',
    description: 'Unacceptable Absence',
  },
  FAILED_TO_ATTEND: {
    code: 'AFTA',
    description: 'Failed To Attend',
  },
}

export const enforcementActionMap: EnforcementActionMap = {
  BREACH_RECALL_INITIATED: { code: 'IBR', description: 'Breach / Recall Initiated' },
  BREACH_RECALL_INITIATED_AND_SEND_LETTER: { code: 'IBR' },
  REFER_TO_OFFENDER_MANAGER: { code: 'ROM', description: 'Refer to Offender Manager' },
  NO_FURTHER_ACTION: { code: 'NFA', description: 'No Further Action' },
  DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION: {
    code: 'EA12',
    description: 'Decision Pending Response from Person on Probation',
  },
  LICENCE_COMPLIANCE_LETTER_SENT: { code: 'LCL', description: 'Licence Compliance Letter Sent' },
  FIRST_WARNING_LETTER_SENT: { code: 'EA02', description: 'First Warning Letter Sent' },
  SECOND_WARNING_LETTER_SENT: { code: 'EA03', description: 'Second Warning Letter Sent' },
  BREACH_LETTER_SENT: { code: 'EA08', description: 'Breach Letter Sent' },
  OTHER_ENFORCEMENT_LETTER_SENT: { code: 'EA05', description: 'Other Enforcement Letter Sent' },
  BREACH_REQUESTED: { code: 'BRE', description: 'Breach Requested' },
  BREACH_REQUEST_ACTIONED: { code: 'BRE', description: 'Breach Request Actioned' },
  SEND_CONFIRMATION_OF_BREACH: { code: 'EA09', description: 'Send Confirmation of Breach' },
  BREACH_CONFIRMATION_SENT: { code: 'EA10', description: 'Breach Confirmation Sent' },
  RECALL_REQUESTED: { code: 'EA11', description: 'Recall Requested' },
  IMMEDIATE_BREACH_OR_RECALL: { code: 'IMB', description: 'Immediate Breach or Recall' },
  ENFORCEMENT_LETTER_REQUESTED: { code: 'WLS', description: 'Enforcement Letter Requested' },
  WITHDRAW_WARNING_LETTER: { code: 'EA06', description: 'Withdraw Warning Letter' },
  DECISION_PENDING_RESPONSE: { code: 'C173', description: 'Breach Action - Decision Pending Response' },
  YOT_OM_NOTIFIED: { code: 'EA13', description: 'YOT OM Notified' },
  WITHDRAWAL_OF_WARNING: { code: 'EA07', description: 'Withdrawal of Warning' },
  ACCEPTABLE_ABSENCE_COURT_LEGAL: { code: 'AACL', description: 'Acceptable Absence - Court/Legal' },
  ACCEPTABLE_ABSENCE_EMPLOYMENT: { code: 'AAEM', description: 'Acceptable Absence - Employment' },
  ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE: { code: 'AAFC', description: 'Acceptable Absence - Family/Childcare' },
  ACCEPTABLE_ABSENCE_HOLIDAY: { code: 'AAHO', description: 'Acceptable Absence - Holiday' },
  ACCEPTABLE_ABSENCE_MEDICAL: { code: 'AAME', description: 'Acceptable Absence - Medical' },
  ACCEPTABLE_ABSENCE_RIC: { code: 'AARC', description: 'Acceptable Absence - RIC' },
  ACCEPTABLE_ABSENCE_RELIGIOUS: { code: 'AARE', description: 'Acceptable Absence - Religious' },
  ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION: {
    code: 'CO05',
    description: 'Acceptable Absence - Professional Judgement Decision',
  },
  ACCEPTABLE_FAILURE: { code: 'EM01', description: 'Acceptable Failure' },
}
