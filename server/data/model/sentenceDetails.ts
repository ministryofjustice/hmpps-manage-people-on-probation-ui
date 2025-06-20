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
  id: number
  eventNumber?: string
  order: Order
  nsis: Nsi[]
  licenceConditions: LicenceCondition[]
  requirements: Requirement[]
  mainOffence?: Offence
  offenceDetails?: OffenceDetails
  conviction?: Conviction
  courtDocuments?: CourtDocument[]
  unpaidWorkProgress?: string
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
  startDate: string
  endDate: string
  length?: string
}

export interface Requirement {
  id: number
  description: string
}

export interface Nsi {
  id: number
  description: string
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
}

export interface ProbationHistory {
  numberOfTerminatedEvents: number
  dateOfMostRecentTerminatedEvent: string
  numberOfTerminatedEventBreaches: number
  numberOfProfessionalContacts: number
}
