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

export interface SmsEventRequest {
  firstName: string
  crn: string
  smsOptIn: boolean
  mobileNumber?: string
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
}

export type SmsOptInOptions = 'YES' | 'YES_ADD_MOBILE_NUMBER' | 'YES_UPDATE_MOBILE_NUMBER' | 'NO' | null | undefined

export interface SmsPreviewRequest {
  firstName: string
  dateAndTimeOfAppointment: string
  appointmentLocation?: string
  appointmentTypeCode?: string
  includeWelshPreview: boolean
}

export interface SmsPreviewResponse {
  englishSmsPreview: string
  welshSmsPreview?: string
}
