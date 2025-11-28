import { Address, Name } from './personalDetails'
import { Appointment } from './overview'

export interface UserCaseload {
  totalPages: number
  totalElements: number
  pageSize: number
  provider: string
  staff: Name
  sortedBy: string
  caseload: Caseload[]
}

export interface TeamCaseload {
  totalPages: number
  totalElements: number
  pageSize: number
  provider: string
  team: Team
  caseload: Caseload[]
}

export interface Caseload {
  caseName: Name
  crn: string
  dob?: string
  nextAppointment?: Appointment
  previousAppointment?: Appointment
  latestSentence?: string
}

export interface CaseloadResponse {
  caseName: Name
  crn: string
}

export interface Team {
  description: string
  code: string
}

export interface Provider {
  code: string
  name: string
}

export interface User {
  username: string
  nameAndRole: string
}

export interface Location {
  id: number
  code: string
  description?: string
  address?: Address
}

export interface UserAppontment {
  totalAppointments: number
  totalOutcomes: number
  appointments: {
    caseName: {
      surname: string
      forename: string
    }
    crn: string
    description: string
    location: string
    date: string
    startTime: string
    endTime: string
  }[]
  outcomes: {
    caseName: {
      surname: string
      forename: string
    }
    crn: string
    description: string
    date: string
  }[]
}

export interface UserLocation {
  id: number
  description: string
  address: {
    buildingNumber?: string
    streetName: string
    town?: string
    county?: string
    postcode?: string
  }
}

export interface UserTeam {
  provider: string
  teams: Team[]
}

export interface UserProviders {
  defaultUserDetails: {
    username: string
    homeArea: string
    team: string
  }
  providers: Provider[]
  teams: Team[]
  users: User[]
}

export interface ProbationPractitioner {
  code: string
  provider: Provider
  team: Team
  name: {
    forename: string
    middleName: string
    surname: string
  }
  unallocated: boolean
  username?: string
}

export interface UserLocations {
  name: {
    forename: string
    middleName: string
    surname: string
  }
  locations: Location[]
}

export interface CaseSearchFilter {
  [key: string]: string | undefined
  nameOrCrn?: string
  sentenceCode?: string
  nextContactCode?: string
}

export interface SelectElement {
  id?: string
  name?: string
  items?: SelectItem[]
}

export interface SelectItem {
  text?: string
  value?: string
  selected?: string
}

export interface ErrorMessages {
  [key: string]: { text: string }
}
