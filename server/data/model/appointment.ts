import { Team, User } from './caseload'

export interface AppointmentTeams {
  teams: Team[]
}
export interface AppointmentStaff {
  users: User[]
}
export interface Breach {
  active: boolean
  createdDate: string
}
