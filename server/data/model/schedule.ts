import { Name, PersonSummary, Document, Address } from './personalDetails'
import { Note } from './note'
import { EnforcementActionCode, OutcomeCode } from '../../properties/appointment-outcomes'

export interface Schedule {
  personSummary: PersonSummary
  personSchedule: PersonSchedule
}

export type LinkedContactResponse = LinkedContact[]

export interface LinkedContact {
  contactId: number
  contactTypeDescription: string
  contactDate: string
  createdBy: CreatedBy
}
export interface CreatedBy {
  forename: string
  middleName?: string
  surname: string
}

export interface EnforcementContactsResponse {
  size: number
  page: number
  totalResults: number
  totalPages: number
  enforcementContacts: EnforcementContact[]
}

export interface EnforcementContact {
  caseName: CaseName
  id: number
  crn: string
  dob: string
  appointmentType: string
  displayName?: string
  appointmentDate: string
  appointmentOutcome: string
  enforcementAction: string
  evidenceDueDate: string
  deliusManaged: boolean
  isOverdue?: boolean
}

export interface CaseName {
  forename: string
  middleName: string
  surname: string
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
export interface EnforcementAction {
  responseByDate: string
}

export interface ContactOutcome {
  code: string
  description: string
  enforcementActions: ContactEnforcementAction[]
}

export interface ContactEnforcementAction {
  code: EnforcementActionCode
  description: string
  defaultResponsePeriodDays?: number
}

export interface ContactOutcomesResponse {
  outcomes: ContactOutcome[]
}

export interface PutContactRequest {
  date: string
  time: string
  outcomeCode: OutcomeCode
  enforcementActionCode?: EnforcementActionCode
  notes?: string
  alert: boolean
  sensitive: boolean
}

export interface Activity {
  id: string
  eventNumber?: string
  type: string
  displayName?: string
  startDateTime: string
  endDateTime?: string
  rarToolKit?: string
  appointmentNotes?: Note[]
  appointmentNote?: Note
  isSensitive?: boolean
  hasOutcome?: boolean
  wasAbsent?: boolean
  officer?: Officer
  isInitial?: boolean
  isNationalStandard?: boolean
  location?: Address
  rescheduled?: boolean
  rescheduledStaff?: boolean
  rescheduledPop?: boolean
  didTheyComply?: boolean
  absentWaitingEvidence?: boolean
  enforcementAction?: EnforcementAction
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
  component?: SentenceComponent
  nsiId?: number
  esupervisionId?: string
  externalReference?: string
}

export interface PersonAppointmentEnforcementAction {
  code?: EnforcementActionCode
  description?: string
  responseByDate?: string
}

export interface PersonAppointment {
  personSummary: PersonSummary
  appointment: Activity
  documents: Document[]
  enforcementAction?: PersonAppointmentEnforcementAction
}
