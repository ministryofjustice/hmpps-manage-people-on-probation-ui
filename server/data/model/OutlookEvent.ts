import { PersonSummary } from './personalDetails'
import { Activity } from './schedule'

export interface OutlookEventRequestBody {
  recipients: Recipient[]
  message: string
  subject: string
  start: string
  durationInMinutes: number
  supervisionAppointmentUrn: string
}

export interface Recipient {
  emailAddress: string
  name: string
}

export interface OutlookEventResponse {
  id: string
  subject: string
  startDate: string
  endDate: string
  attendees: string[]
}

export interface RescheduleEventRequest {
  rescheduledEventRequest: EventRequest
  oldSupervisionAppointmentUrn: string
}

export interface EventRequest {
  emailAddress: string
  name: string
}

export interface EventResponse {
  id?: string
  subject: string
  startDate: string
  endDate: string
}
