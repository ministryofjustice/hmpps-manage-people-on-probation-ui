import { PersonSummary } from './personalDetails'
import { Note } from './note'

export interface RequirementNoteDetails {
  personSummary: PersonSummary
  requirement: Requirement
}

export interface Requirement {
  code: string
  expectedStartDate?: string
  actualStartDate: string
  expectedEndDate?: string
  actualEndDate?: string
  terminationReason?: string
  description: string
  length: number
  lengthUnitValue: string
  requirementNote: Note
  rar?: {
    completed: number
    scheduled: number
    totalDays: number
  }
}
