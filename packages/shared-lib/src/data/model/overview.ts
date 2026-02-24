import { Mappa } from './risk'
import { PersonalDetails } from './personalDetails'
import { Sentence, Order } from './sentenceDetails'
import { Schedule } from './schedule'

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

export interface PreviousOrders {
  breaches: number
  count: number
  orders?: Order[]
}

export interface NextAppointment {
  date: string
  description: string
}

export interface Appointment {
  date: string
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
