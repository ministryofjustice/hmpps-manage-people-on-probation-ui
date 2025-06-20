import { Location, Provider, Team, User } from '../data/model/caseload'
import { PersonalDetails } from '../data/model/personalDetails'
import { Sentence } from '../data/model/sentenceDetails'
import { AppointmentSession, AppointmentType } from './Appointments'
import { Errors } from './Errors'

export interface Data {
  appointments?: {
    [crn: string]: {
      [id: string]: AppointmentSession
    }
  }
  sentences?: {
    [crn: string]: Sentence[]
  }
  appointmentTypes?: AppointmentType[]
  personalDetails?: {
    [crn: string]: PersonalDetails
  }
  errors?: Errors
  locations?: {
    [userId: string]: Location[]
  }
  region?: string
  team?: string
  providers?: {
    [userId: string]: Provider[]
  }
  teams?: {
    [userId: string]: Team[]
  }
  staff?: {
    [userId: string]: User[]
  }
}
