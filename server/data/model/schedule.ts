import { Name, PersonSummary, Document, Address } from './personalDetails'
import { Note } from './note'

export interface Schedule {
  personSummary: PersonSummary
  personSchedule: PersonSchedule
}

export interface Officer {
  code?: string
  name?: Name
  teamCode?: string
  providerCode?: string
  username?: string
}

export interface SentenceComponent {
  id?: number
  description?: string
  type?: string
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
  officer?: Officer
  isInitial: boolean
  isNationalStandard: boolean
  location?: Address
  rescheduled: boolean
  rescheduledStaff: boolean
  rescheduledPop: boolean
  didTheyComply?: boolean
  absentWaitingEvidence?: boolean
  rearrangeOrCancelReason?: string
  rescheduledBy?: Name
  repeating?: boolean
  nonComplianceReason?: string
  documents: Document[]
  isRarRelated?: boolean
  rarCategory?: string
  acceptableAbsence?: boolean
  acceptableAbsenceReason?: string
  isAppointment: boolean
  isCommunication: boolean
  action?: string
  isSystemContact?: boolean
  isEmailOrTextFromPop?: boolean
  isPhoneCallFromPop?: boolean
  isEmailOrTextToPop?: boolean
  isPhoneCallToPop?: boolean
  isInPast: boolean
  isPastAppointment: boolean
  countsTowardsRAR?: boolean
  lastUpdated?: string
  lastUpdatedBy?: Name
  deliusManaged?: boolean
  isVisor?: boolean
  description?: string
  outcome?: string
  eventID?: number
  component?: SentenceComponent
  nsiId?: number
}

export interface PersonAppointment {
  personSummary: PersonSummary
  appointment: Activity
}
