import { PersonSummary } from './personalDetails'
import { ActivityCount, Compliance, Offence, Order, PreviousOrders } from './overview'

export interface PersonCompliance {
  personSummary: PersonSummary
  previousOrders: PreviousOrders
  currentSentences: SentenceCompliance[]
}

export interface ContactType {
  code: string
  description: string
}

export interface NonComplianceContact {
  contactId: number
  eventNumber: string
  eventId: number
  type: ContactType
  date: string
}

export interface NonComplianceHistoryResponse {
  acceptableAbsence: NonComplianceContact[]
  unacceptableAbsence: NonComplianceContact[]
  attendedButDidNotComply: NonComplianceContact[]
}

export interface SentenceCompliance {
  eventNumber: string
  activity: ActivityCount
  compliance: Compliance
  mainOffence: Offence
  order: Order
  activeBreach?: Breach
  rarDescription?: string
}

export interface Breach {
  startDate: string
  status: string
}
