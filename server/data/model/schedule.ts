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
  id: string
  eventNumber?: string
  type: string
  startDateTime: string
  endDateTime?: string
  rarToolKit?: string
  appointmentNotes?: Note[]
  appointmentNote?: Note
  isSensitive?: boolean
  hasOutcome?: boolean
  wasAbsent?: boolean
  officer?: {
    code: string
    name: Name
  }
  isInitial?: boolean
  isNationalStandard?: boolean
  location?: Address
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
  isRarRelated?: boolean
  rarCategory?: string
  acceptableAbsence?: boolean
  acceptableAbsenceReason?: string
  isAppointment?: boolean
  isCommunication?: boolean
  action?: string
  isSystemContact?: boolean
  isEmailOrTextFromPop?: boolean
  isPhoneCallFromPop?: boolean
  isEmailOrTextToPop?: boolean
  isPhoneCallToPop?: boolean
  isInPast?: boolean
  isPastAppointment?: boolean
  countsTowardsRAR?: boolean
  lastUpdated?: string
  lastUpdatedBy?: Name
  description?: string
  outcome?: string
  deliusManaged?: boolean
  isVisor?: boolean
  eventId?: number
  component?: {
    id: number
    description: string
    type: string
  }
  nsiId?: number
}

export interface PersonAppointment {
  personSummary: PersonSummary
  appointment: Activity
}
