import { type Name } from '../data/model/personalDetails'
import type { EnforcementAction, Activity, ContactOutcomes, ContactEnforcementActions } from '../data/model/schedule'
import { type Errors } from './Errors'
import type { SmsPreviewSession, SmsOptInOptions } from '../data/model/OutlookEvent'
import { type Option } from './Option'
import type { OutcomeCode, EnforcementActionCode } from '../properties/appointment-outcomes/code-map'

export type YesNo = '' | 'Yes' | 'No'

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export type AppointmentSessionSelection = 'KEEP_TYPE' | 'CHANGE_TYPE' | 'RESCHEDULE' | 'NO'

export const appointmentOutcomeTypes = [
  'ATTENDED_COMPLIED',
  'ATTENDED_FAILED_TO_COMPLY',
  'ATTENDED_SENT_HOME_BEHAVIOUR',
  'ATTENDED_SENT_HOME_SERVICE_ISSUES',
  'ACCEPTABLE_ABSENCE',
  'UNACCEPTABLE_ABSENCE',
  'FAILED_TO_ATTEND',
  'WILL_BE_RESCHEDULED',
] as const

export type AppointmentOutcomeType = (typeof appointmentOutcomeTypes)[number]

export const breachEnforcementActions = [
  'BREACH_REQUESTED',
  'BREACH_RECALL_INITIATED',
  'BREACH_CONFIRMATION_SENT',
  'BREACH_LETTER_SENT',
  'BREACH_REQUEST_ACTIONED',
  'SEND_CONFIRMATION_OF_BREACH',
  'IMMEDIATE_BREACH_OR_RECALL',
] as const

export type BreachEnforcementAction = (typeof breachEnforcementActions)[number]

export const letterEnforcementActions = [
  'FIRST_WARNING_LETTER_SENT',
  'SECOND_WARNING_LETTER_SENT',
  'OTHER_ENFORCEMENT_LETTER_SENT',
  'LICENCE_COMPLIANCE_LETTER_SENT',
  'ENFORCEMENT_LETTER_REQUESTED',
  'WITHDRAW_WARNING_LETTER',
] as const

export type LetterEnforcementAction = (typeof letterEnforcementActions)[number]

export const appointmentEnforcementActions = [
  'BREACH_RECALL_INITIATED',
  'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
  'REFER_TO_OFFENDER_MANAGER',
  'NO_FURTHER_ACTION',
  'DIFFERENT_ACTION',
  'ACCEPTABLE_ABSENCE_COURT_LEGAL',
  'ACCEPTABLE_ABSENCE_EMPLOYMENT',
  'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE',
  'ACCEPTABLE_ABSENCE_HOLIDAY',
  'ACCEPTABLE_ABSENCE_MEDICAL',
  'ACCEPTABLE_ABSENCE_RELIGIOUS',
  'ACCEPTABLE_ABSENCE_RIC',
  'ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION',
  'ACCEPTABLE_FAILURE',
  'DECISION_PENDING_RESPONSE_FROM_PERSON_ON_PROBATION',
  'DECISION_PENDING_RESPONSE',
  'SEND_CONFIRMATION_OF_BREACH',
  'RECALL_REQUESTED',
  'IMMEDIATE_BREACH_OR_RECALL',
  'YOT_OM_NOTIFIED',
  'WITHDRAWAL_OF_WARNING',
  'SEND_LETTER',
  'SEND_ANOTHER_LETTER',
  'WILL_BE_RESCHEDULED',
  ...breachEnforcementActions,
  ...letterEnforcementActions,
] as const

export type AppointmentEnforcementAction = (typeof appointmentEnforcementActions)[number]

export interface AppointmentOutcome {
  type: AppointmentOutcomeType
  complied: 'YES' | 'NO'
}

export const isEnforcementActionMapKey = (value: string): value is AppointmentEnforcementAction => {
  return appointmentEnforcementActions.includes(value as AppointmentEnforcementAction)
}

export const isEnforcementActionPageKey = (value: string): value is EnforcementActionPage => {
  return enforcementActionPageKeys.includes(value as EnforcementActionPage)
}

export const enforcementActionPageKeys = [
  'attendedFailedToComply',
  'acceptableAbsence',
  'unacceptableAbsence',
  'failedToAttend',
  'otherEnforcementAction',
  'breachNSICreatedBy',
  'letterType',
  'letterSentBy',
  'updateEnforcementAction',
] as const satisfies readonly (keyof AppointmentSessionOutcome)[]

export type EnforcementActionPage = (typeof enforcementActionPageKeys)[number]

export interface AppointmentSessionOutcome {
  outcomeType?: AppointmentOutcomeType
  outcomeCode?: OutcomeCode
  enforcementActionCode?: EnforcementActionCode[]
  attendedFailedToComply?: AppointmentEnforcementAction
  acceptableAbsence?: AppointmentEnforcementAction
  unacceptableAbsence?: AppointmentEnforcementAction
  failedToAttend?: AppointmentEnforcementAction
  otherEnforcementAction?: AppointmentEnforcementAction
  breachNSICreatedBy?: EnforcementActionCreatedBy
  letterSentBy?: EnforcementActionCreatedBy
  letterType?: AppointmentEnforcementAction
  updateEnforcementAction?: AppointmentEnforcementAction
  contactOutcomes?: ContactOutcomes[]
  contactEnforcementActions?: ContactEnforcementActions[]
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
  linkedContactId?: string
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
  outcome?: AppointmentSessionOutcome
  sensitivityLocked?: boolean
}

export type EnforcementActionCreatedBy = 'CASE_ADMIN' | 'USER'

export type EnforcementActionLetterType =
  | 'LICENCE_COMPLIANCE_LETTER_SENT'
  | 'FIRST_WARNING_LETTER_SENT'
  | 'SECOND_WARNING_LETTER_SENT'
  | 'BREACH_LETTER_SENT'
  | 'OTHER_ENFORCEMENT_LETTER_SENT'

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
  contactId?: string
  whoNeedsToReschedule?: RescheduleRequestedBy
  reason?: string
  files?: string[]
  sensitivity?: YesNo
  previousStart?: string
  previousEnd?: string
}

export interface AppointmentChecks {
  [index: string]: AppointmentCheck | string | undefined
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
  options?:
    | Option<AppointmentOutcomeType>[]
    | Option<AppointmentEnforcementAction | ''>[]
    | Option<EnforcementActionCreatedBy>[]
  isSensitive?: boolean
}

export interface ProbationDeliveryUnit {
  code: string
  description: string
}

export interface MasUserDetails {
  userId: number
  username: string
  firstName: string
  surname: string
  email?: string
  enabled: boolean
  roles: string[]
  staff?: {
    probationDeliveryUnits?: ProbationDeliveryUnit[]
  }
}

export interface AttendedCompliedAppointment {
  type: string
  officer: {
    name: Name
  }
  startDateTime: string
}
