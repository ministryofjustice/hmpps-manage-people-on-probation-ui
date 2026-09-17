import { PersonSummary } from './personalDetails'
import { Activity } from './schedule'

export interface SmsEventRequest {
  firstName: string
  mobileNumber?: string
  crn: string
  smsOptIn: boolean
  includeWelshTranslation: boolean
  appointmentLocation?: string
  appointmentTypeCode?: string
  practitionerFirstName?: string
}
export interface OutlookEventRequestBody {
  recipients: Recipient[]
  message: string
  subject: string
  start: string
  durationInMinutes: number
  supervisionAppointmentUrn: string
  smsEventRequest?: SmsEventRequest
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
  smsResponse?: SmsResponse
}

export interface RescheduleEventRequest {
  rescheduledEventRequest: EventRequest
  oldSupervisionAppointmentUrn: string
}

export interface EventRequest {
  recipients: Recipient[]
  message: string
  subject: string
  start: string
  durationInMinutes: number
  supervisionAppointmentUrn: string
  smsEventRequest?: SmsEventRequest
}

export interface EventResponse {
  id?: string
  subject: string
  startDate: string
  endDate: string
  attendees: string[]
  smsResponse?: SmsResponse
}

export interface SmsResponse {
  englishNotificationId?: string
  welshNotificationId?: string
}
export type SmsOptInOptions = 'YES' | 'YES_ADD_MOBILE_NUMBER' | 'YES_UPDATE_MOBILE_NUMBER' | 'NO' | null | undefined

export interface SmsPreviewRequest {
  firstName: string
  recipientEmail?: string
  dateAndTimeOfAppointment: string
  appointmentLocation?: string
  appointmentTypeCode?: string
  includeWelshPreview: boolean
  practitionerFirstName?: string
}

export interface SmsPreviewResponse {
  englishSmsPreview: string
  welshSmsPreview?: string
}

export interface SmsPreviewSession {
  request: SmsPreviewRequest
  preview: SmsPreviewResponse
}
