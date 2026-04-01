import { type Name } from '../data/model/personalDetails'
import { type Activity } from '../data/model/schedule'
import { type Errors } from './Errors'
import { type SmsPreviewSession, type SmsOptInOptions } from '../data/model/OutlookEvent'
import { Option } from './Option'

export type YesNo = '' | 'Yes' | 'No'

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export type AppointmentSessionSelection = 'KEEP_TYPE' | 'CHANGE_TYPE' | 'RESCHEDULE' | 'NO'

export type AppointmentOutcomeType =
  | 'ATTENDED'
  | 'ATTENDED_SENT_HOME_BEHAVIOUR'
  | 'ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS'
  | 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES'
  | 'ACCEPTABLE_ABSENCE'
  | 'UNACCEPTABLE_ABSENCE'
  | 'EVIDENCE_REQUESTED'
  | 'WILL_BE_RESCHEDULED'

export interface AppointmentOutcome {
  type: AppointmentOutcomeType
  complied: 'YES' | 'NO'
}

export interface AppointmentOutcomeOption extends Option {
  value: AppointmentOutcomeType
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
  }
}

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
  options?: AppointmentOutcomeOption[]
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
