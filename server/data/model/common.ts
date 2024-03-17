import { PersonAddress } from './personalDetails'

export interface Name {
  forename: string
  middleName?: string
  surname: string
}
export interface PersonalCircumstance {
  subType: string
  type: string
}

export interface AddressOverview {
  personSummary: PersonSummary
  mainAddress?: PersonAddress
  otherAddresses: PersonAddress[]
  previousAddresses: PersonAddress[]
}

export interface PersonSummary {
  name: Name
  crn: string
  pnc?: string
  dateOfBirth: string
}

