import { Name } from '../data/model/personalDetails'
import { Errors } from './Errors'

export interface AppointmentSession {
  user?: {
    username: string
    teamCode: string
    locationCode: string
  }
  type?: string
  visorReport?: 'Yes' | 'No'
  date?: string
  start?: string
  end?: string
  interval?: string
  numberOfAppointments?: string
  eventId?: string
  uuid?: string
  requirementId?: string
  licenceConditionId?: string
  nsiId?: string
  repeating?: 'Yes' | 'No'
  repeatingDates?: string[]
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
  eventId: number
  uuid: string
  createOverlappingAppointment: true
  requirementId: number
  licenceConditionId: number
  nsiId: number
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
