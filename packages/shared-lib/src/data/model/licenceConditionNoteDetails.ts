import { PersonSummary } from './personalDetails'
import { Note } from './note'

export interface LicenceConditionNoteDetails {
  personSummary: PersonSummary
  licenceCondition: LicenceCondition
}

export interface LicenceCondition {
  mainDescription: string
  subTypeDescription: string
  imposedReleasedDate: string
  actualStartDate: string
  licenceNote: Note
}
