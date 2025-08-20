import { Name, PersonSummary } from '../data/model/personalDetails'
import { Activity } from '../data/model/schedule'
import { Errors } from './Errors'

export interface AppointmentSession {
  user?: {
    providerCode?: string
    teamCode?: string
    username?: string
    locationCode?: string
  }
  type?: string
  visorReport?: 'Yes' | 'No'
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
  repeating?: 'Yes' | 'No'
  repeatingDates?: string[]
  notes?: string
  sensitivity?: 'Yes' | 'No'
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

export interface NextComAppointmentResponse {
  appointment: Activity
  loggedInUserIsCOM: boolean
  com: Name
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

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export interface AppointmentRequestBody {
  user: {
    username: string
    teamCode: string
    locationCode: string
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

export interface LocalParams {
  crn: string
  id: string
  errors?: Errors
  _minDate?: string
  _maxDate?: string
}
