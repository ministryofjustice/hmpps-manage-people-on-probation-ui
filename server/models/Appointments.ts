import { type AttendedCompliedAppointment } from '../middleware'
import { Name } from '../data/model/personalDetails'
import { Activity } from '../data/model/schedule'
import { Errors } from './Errors'

export type YesNo = '' | 'Yes' | 'No'

export type SmsOptInOptions = 'YES' | 'YES_ADD_MOBILE_NUMBER' | 'YES_UPDATE_MOBILE_NUMBER' | 'NO'

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export interface AppointmentSessionUser {
  providerCode?: string
  teamCode?: string
  username?: string
  name?: Name
  locationCode?: string
  staffCode?: string
}

export interface AppointmentSession {
  user?: AppointmentSessionUser
  type?: string
  visorReport?: YesNo
  date?: string
  start?: string
  end?: string
  until?: string
  interval?: AppointmentInterval
  numberOfAppointments?: string
  numberOfRepeatAppointments?: string
  eventId?: string
  username?: string
  uuid?: string
  requirementId?: string
  licenceConditionId?: string
  nsiId?: string
  repeating?: YesNo
  repeatingDates?: string[]
  notes?: string
  sensitivity?: YesNo
  backendId?: number
  outcomeRecorded?: YesNo
  contactId?: string
  rescheduleAppointment?: RescheduleAppointment
  externalReference?: string
  smsOptIn?: SmsOptInOptions
  temp?: {
    providerCode?: string
    teamCode?: string
    username?: string
    isInPast?: boolean
    date?: string
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
  interval: AppointmentInterval
  numberOfAppointments: number
  eventId?: number
  uuid: string
  createOverlappingAppointment: true
  requirementId?: number
  licenceConditionId?: number
  nsiId?: number
  until?: Date
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
  errors?: Errors
  body?: Record<string, string | string[]>
  _minDate?: string
  _maxDate?: string
  contactId?: string
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
