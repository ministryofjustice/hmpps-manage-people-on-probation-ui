import { type Name } from '../data/model/personalDetails'
import { type EnforcementAction, type Activity } from '../data/model/schedule'
import { type Errors } from './Errors'
import { type SmsPreviewSession, type SmsOptInOptions } from '../data/model/OutlookEvent'
import { Option } from './Option'

export type YesNo = '' | 'Yes' | 'No'

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export type AppointmentSessionSelection = 'KEEP_TYPE' | 'CHANGE_TYPE' | 'RESCHEDULE' | 'NO'

export type AppointmentOutcomeType =
  | 'ATTENDED_COMPLIED'
  | 'ATTENDED_FAILED_TO_COMPLY'
  | 'ATTENDED_SENT_HOME_BEHAVIOUR'
  | 'ATTENDED_SENT_HOME_SERVICE_ISSUES'
  | 'ACCEPTABLE_ABSENCE'
  | 'UNACCEPTABLE_ABSENCE'
  | 'FAILED_TO_ATTEND'
  | 'WILL_BE_RESCHEDULED'

export type AppointmentEnforcementAction =
  | 'SEND_LETTER'
  | 'INITIATE_BREACH_RECALL'
  | 'INITIATE_BREACH_RECALL_AND_SEND_LETTER'
  | 'REFER_TO_OFFENDER_MANAGER'
  | 'NO_FURTHER_ACTION'
  | 'DIFFERENT_ACTION'
  | 'COURT_LEGAL'
  | 'EMPLOYMENT'
  | 'FAMILY_CHILDCARE'
  | 'HOLIDAY'
  | 'MEDICAL'
  | 'RELIGIOUS'
  | 'RIC'
  | 'PROFESSIONAL_JUDGEMENT_DECISION'
  | 'ACCEPTABLE_FAILURE'
  | 'DECISION_PENDING'
  | 'BREACH_REQUESTED'
  | 'BREACH_RECALL_INITIATED'
  | 'BREACH_RECALL_INITIATED'
  | 'BREACH_CONFIRMATION_SENT'
  | 'BREACH_CONFIRMATION_SENT'
  | 'BREACH_LETTER_SENT'
  | 'BREACH_REQUEST_ACTIONED'
  | 'SEND_CONFIRMATION_OF_BREACH'
  | 'RECALL_REQUESTED'
  | 'IMMEDIATE_BREACH_OR_RECALL'
  | 'FIRST_WARNING_LETTER_SENT'
  | 'SECOND_WARNING_LETTER_SENT'
  | 'OTHER_ENFORCEMENT_LETTER_SENT'
  | 'LICENCE_COMPLIANCE_LETTER_SENT'
  | 'ENFORCEMENT_LETTER_REQUESTED'
  | 'WITHDRAW_WARNING_LETTER'
  | 'DECISION_PENDING_RESPONSE'
  | 'YOT_OM_NOTIFIED'
  | 'WITHDRAWAL_OF_WARNING'

export interface AppointmentOutcome {
  type: AppointmentOutcomeType
  complied: 'YES' | 'NO'
}

export interface AppointmentOutcomeOption extends Option {
  value?: AppointmentOutcomeType
}

export interface AppointmentEnforcementActionOption extends Option {
  value?: AppointmentEnforcementAction | ''
}

export interface EnforcementActionCreatedByOption extends Option {
  value?: EnforcementActionCreatedBy
}

export interface EnforcementActionLetterTypeOption extends Option {
  value?: EnforcementActionLetterType
}

export interface AppointmentSessionUser {
  providerCode?: string
  teamCode?: string
  username?: string
  locationCode?: string
  staffCode?: string
  name?: Name
  email?: string
}

export interface AppointmentSession {
  user?: AppointmentSessionUser
  type?: string
  visorReport?: YesNo
  date?: string
  start?: string
  end?: string
  eventId?: string
  username?: string
  uuid?: string
  requirementId?: string
  licenceConditionId?: string
  nsiId?: string
  notes?: string
  sensitivity?: YesNo
  backendId?: number
  enforcementAction?: EnforcementAction
  outcomeRecorded?: YesNo
  contactId?: string
  rescheduleAppointment?: RescheduleAppointment
  externalReference?: string
  smsOptIn?: SmsOptInOptions
  smsPreview?: SmsPreviewSession
  temp?: {
    providerCode?: string
    teamCode?: string
    username?: string
    isInPast?: boolean
    date?: string
  }
  outcome?: {
    type: AppointmentOutcomeType
    enforcementAction: AppointmentEnforcementAction
    breachNSICreatedBy?: EnforcementActionCreatedBy
    letterSentBy?: EnforcementActionCreatedBy
    letterType?: EnforcementActionLetterType
  }
}

export type EnforcementActionCreatedBy = 'CASE_ADMIN' | 'USER'

export type EnforcementActionLetterType = 'LICENCE_COMPLIANCE_LETTER' | 'DIFFERENT_ENFORCEMENT_LETTER'

export interface AppointmentType {
  code: string
  description: string
  isPersonLevelContact: boolean
  isLocationRequired: boolean
}

export interface AppointmentTypeResponse {
  appointmentTypes: AppointmentType[]
}

export interface NextAppointmentResponse {
  appointment: Activity
  usernameIsCom: boolean
  personManager: {
    code: string
    name: Name
  }
}

export interface AppointmentLocationRequest {
  provideCode: string
  teamCode: string
}
export interface AppointmentLocationResponse {
  locations: AppointmentLocation[]
}

export interface AppointmentLocation {
  id: number
  code: string
}

export interface AppointmentTypeOption {
  text: string
  value: AppointmentType
}

export interface AppointmentRequestBody {
  user: {
    username: string
    teamCode: string
    locationCode: string | null
  }
  type: string
  start: Date
  end: Date
  eventId?: number
  uuid: string
  requirementId?: number
  licenceConditionId?: number
  nsiId?: number
  notes?: string
  sensitive?: boolean
  visorReport?: boolean
  outcomeRecorded?: boolean
}

export type RescheduleRequestedBy = 'POP' | 'SERVICE'

export interface RescheduleAppointmentRequestBody {
  date: string
  startTime: string
  endTime: string
  staffCode?: string
  teamCode?: string
  locationCode?: string
  outcomeRecorded: boolean
  notes?: string
  sensitive?: boolean
  sendToVisor?: boolean
  requestedBy: RescheduleRequestedBy
  reasonForRecreate?: string
  reasonIsSensitive?: boolean
  uuid?: string
  isInFuture: boolean
}

export interface RescheduleAppointmentResponse {
  id: number
  externalReference: string
}

export interface CheckAppointment {
  start: Date
  end: Date
}

export interface AppointmentPatch {
  id: number
  outcomeRecorded?: boolean
  visorReport?: boolean
  notes?: string
  files?: string[]
  sensitive?: boolean
  date?: string
  startTime?: string
}

export interface RescheduleAppointment {
  whoNeedsToReschedule?: RescheduleRequestedBy
  reason?: string
  files?: string[]
  sensitivity?: YesNo
  previousStart?: string
  previousEnd?: string
}

export interface AppointmentChecks {
  [index: string]: AppointmentCheck | string
  nonWorkingDayName?: string
  isWithinOneHourOfMeetingWith?: AppointmentCheck
  overlapsWithMeetingWith?: AppointmentCheck
}

export interface AppointmentCheck {
  isCurrentUser: boolean
  appointmentIsWith: Name
  startAndEnd: string
}

export interface AppointmentPostResponse {
  id: number
  externalReference: string
}

export interface AppointmentsPostResponse {
  appointments: AppointmentPostResponse[]
}

export interface LocalParams {
  crn: string
  id: string
  contactId?: string
  uuid?: string
  errors?: Errors
  body?: Record<string, string | string[]>
  _minDate?: string
  _maxDate?: string
  uploadedFiles?: any
  personLevel?: boolean
  maxCharCount?: number
  actionType?: string
  back?: string
  change?: string
  isInPast?: boolean
  alertDismissed?: boolean
  forename?: string
  appointment?: AttendedCompliedAppointment | Activity
  useDecorator?: boolean
  isReschedule?: boolean
  options?: AppointmentOutcomeOption[] | AppointmentEnforcementActionOption[] | EnforcementActionCreatedByOption[]
}

export interface MasUserDetails {
  userId: number
  username: string
  firstName: string
  surname: string
  email?: string
  enabled: boolean
  roles: string[]
}

export interface AttendedCompliedAppointment {
  type: string
  officer: {
    name: Name
  }
  startDateTime: string
}
