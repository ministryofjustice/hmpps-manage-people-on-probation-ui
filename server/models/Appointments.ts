import { Name } from '../data/model/personalDetails'
import { Errors } from './Errors'

export interface Appointment {
  type: string
  location: string
  date: string
  'start-time': string
  'end-time': string
  repeating?: 'Yes' | 'No'
  'repeating-frequency'?: string
  'repeating-count'?: string
  id?: string
}

export type AppointmentType =
  | 'HomeVisitToCaseNS'
  | 'InitialAppointmentInOfficeNS'
  | 'PlannedOfficeVisitNS'
  | 'InitialAppointmentHomeVisitNS'

export interface AppointmentTypeOption {
  text: string
  value: AppointmentType
}

export type AppointmentInterval = 'DAY' | 'WEEK' | 'FORTNIGHT' | 'FOUR_WEEKS'

export interface AppointmentRequestBody {
  user: {
    username: string
    locationId: number
  }
  type: AppointmentType
  start: Date
  end: Date
  interval: AppointmentInterval
  numberOfAppointments: number
  eventId: number
  uuid: string
  createOverlappingAppointment: boolean
  requirementId: number
  licenceConditionId: number
  until?: string
}

export interface CheckAppointment {
  start: Date
  end: Date
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
  minDate?: string
}
