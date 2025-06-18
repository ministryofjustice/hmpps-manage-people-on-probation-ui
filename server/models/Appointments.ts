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

export interface ProviderRequestBody {
  provider?: string
  team?: string
}
