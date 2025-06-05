import { PersonSummary } from './personalDetails'
import { Note } from './note'

export interface SentenceDetails {
  personSummary: PersonSummary
  sentenceDescriptions: SentenceDescription[]
  sentence: Sentence
}

export interface Sentences {
  personSummary: PersonSummary
  sentences: Sentence[]
}
export interface SentenceDescription {
  id: string
  description: string
  eventNumber: string
}

export interface Sentence {
  eventId?: number
  mainOffence: Offence
  offenceDetails: OffenceDetails
  conviction: Conviction
  order: Order
  requirements: Requirement[]
  courtDocuments: CourtDocument[]
  unpaidWorkProgress: string
  licenceConditions: LicenceCondition[]
}

export interface OffenceDetails {
  eventNumber: string
  offence: Offence
  dateOfOffence: string
  notes: string
  additionalOffences: Offence[]
}

export interface Conviction {
  sentencingCourt: string
  responsibleCourt: string
  convictionDate: string
  additionalSentences: string
}

export interface Offence {
  code: string
  description: string
}

export interface Order {
  description: string
  length: string
  startDate: string
}

export interface Requirement {
  id: number
  code: string
  expectedStartDate: string
  actualStartDate: string
  expectedEndDate: string
  actualEndDate: string
  terminationReason: string
  description: string
  codeDescription: string
  length: string
  requirementNotes?: Note[]
  requirementNote?: Note
  rar: Rar
}

export interface Rar {
  completed: string
  scheduled: string
  totalDays: string
}

export interface CourtDocument {
  id: string
  lastSaved: string
  documentName: string
}

export interface LicenceCondition {
  id: number
  mainDescription: string
  subTypeDescription: string
  imposedReleasedDate: string
  actualStartDate: string
  notes: Note[]
}

export interface ProbationHistory {
  numberOfTerminatedEvents: number
  dateOfMostRecentTerminatedEvent: string
  numberOfTerminatedEventBreaches: number
  numberOfProfessionalContacts: number
}
