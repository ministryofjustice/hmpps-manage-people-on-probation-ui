import { Mappa } from './risk'
import { Name, PersonalCircumstance } from './personalDetails'

export interface Overview {
  absencesWithoutEvidence: number
  activity?: ActivityCount
  compliance?: Compliance
  personalDetails: PersonalDetails
  previousOrders: PreviousOrders
  schedule: Schedule
  sentences: Sentence[]
  registrations: string[]
  mappa?: Mappa
}

export interface Offence {
  code: string
  description: string
}

export interface Sentence {
  additionalOffences: Offence[]
  mainOffence: Offence
  order?: Order
  rarDescription?: string
}

export interface Rar {
  completed: number
  scheduled: number
  totalDays: number
}

export interface Order {
  status?: string
  mainOffence?: string
  description: string
  endDate?: string
  startDate: string
  breaches?: number
}

export interface PreviousOrders {
  breaches: number
  count: number
  orders?: Order[]
}

export interface Schedule {
  nextAppointment?: NextAppointment
}

export interface NextAppointment {
  date: string
  description: string
}

export interface Appointment {
  date: string
  description: string
}

export interface PersonalDetails {
  name: Name
  preferredGender: string
  preferredName?: string
  telephoneNumber?: string
  mobileNumber?: string
  disabilities: Disability[]
  provisions: Provision[]
  personalCircumstances: PersonalCircumstance[]
  dateOfBirth: string
  dateOfDeath?: string
}
export interface Disability {
  description: string
}

export interface Provision {
  description: string
}

export interface ActivityCount {
  unacceptableAbsenceCount: number
  attendedButDidNotComplyCount: number
  outcomeNotRecordedCount: number
  waitingForEvidenceCount: number
  rescheduledCount: number
  absentCount: number
  rescheduledByStaffCount: number
  rescheduledByPersonOnProbationCount: number
  lettersCount: number
  nationalStandardAppointmentsCount: number
  compliedAppointmentsCount: number
}

export interface Compliance {
  currentBreaches: number
  priorBreachesOnCurrentOrderCount: number
  failureToComplyInLast12Months: number
  breachStarted: boolean
  breachesOnCurrentOrderCount: number
  failureToComplyCount: number
}
