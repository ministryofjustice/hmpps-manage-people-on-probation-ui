import { Name } from './personalDetails'

export interface Offences {
  name: Name
  mainOffence: Offence
  mainOffenceNotes: string
  additionalOffences: Offence[]
}

export interface Offence {
  description: string
  code: string
  category?: string
  dateOfOffence?: string
}
