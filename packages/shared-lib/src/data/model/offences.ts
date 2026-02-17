import { Name } from './personalDetails'

export interface Offences {
  name: Name
  mainOffence: Offence
  mainOffenceNotes: string
  additionalOffences: Offence[]
}

export interface Offence {
  description: string
  category: string
  code: string
  dateOfOffence: string
}
