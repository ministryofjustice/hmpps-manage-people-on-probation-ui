export interface AppointmentSession {
  type?: string
  visorReport?: 'Yes' | 'No'
  location?: string
  date?: string
  'start-time'?: string
  'end-time'?: string
  repeating?: 'Yes' | 'No'
  'repeating-frequency'?: string
  'repeating-count'?: string
  sentence?: string
  'sentence-licence-condition'?: string
  'sentence-requirement'?: string
  'sentence-nsi'?: string
  id?: string
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
    locationId: number
  }
  type: any
  start: Date
  end: Date
  interval: AppointmentInterval
  numberOfAppointments: number
  eventNumber: number
  uuid: string
  createOverlappingAppointment: boolean
  requirementId: number
  licenceConditionId: number
  until?: string
}
