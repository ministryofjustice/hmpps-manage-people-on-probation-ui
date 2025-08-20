import { Name, PersonSummary, Document, Address } from './personalDetails'
import { Note } from './note'

export interface Schedule {
  personSummary: PersonSummary
  personSchedule: PersonSchedule
}

export interface PersonSchedule {
  size: number
  page: number
  totalResults: number
  totalPages: number
  appointments: Activity[]
}
export interface Activity {
  id?: string
  eventNumber?: string
  type?: string
  startDateTime?: string
  endDateTime?: string
  rarToolKit?: string
  appointmentNotes?: Note[]
  appointmentNote?: Note
  isSensitive?: boolean
  hasOutcome?: boolean
  wasAbsent?: boolean
  officerName?: Name
  isInitial?: boolean
  isNationalStandard?: boolean
  rescheduled?: boolean
  rescheduledStaff?: boolean
  rescheduledPop?: boolean
  didTheyComply?: boolean
  absentWaitingEvidence?: boolean
  rearrangeOrCancelReason?: string
  rescheduledBy?: Name
  repeating?: boolean
  nonComplianceReason?: string
  documents?: Document[]
  rarCategory?: string
  acceptableAbsence?: boolean
  acceptableAbsenceReason?: string
  location?: Address
  action?: string
  isSystemContact?: boolean
  isAppointment?: boolean
  isCommunication?: boolean
  isEmailOrTextFromPop?: boolean
  isPhoneCallFromPop?: boolean
  isEmailOrTextToPop?: boolean
  isPhoneCallToPop?: boolean
  lastUpdated?: string
  lastUpdatedBy?: Name
  deliusManaged?: boolean
}

export interface PersonAppointment {
  personSummary: PersonSummary
  appointment: Activity
}
