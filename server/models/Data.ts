import { Location } from '../data/model/caseload'
import { PersonalDetails } from '../data/model/personalDetails'
import { Sentence } from '../data/model/sentenceDetails'
import { Appointment } from './Appointments'
import { Errors } from './Errors'

export interface Data {
  appointments?: {
    [crn: string]: {
      [id: string]: Appointment
    }
  }
  sentences?: {
    [crn: string]: Sentence[]
  }
  personalDetails?: {
    [crn: string]: PersonalDetails
  }
  errors?: Errors
  locations?: {
    [userId: string]: Location[]
  }
}
