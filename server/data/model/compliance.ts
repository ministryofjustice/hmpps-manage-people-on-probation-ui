import { PersonSummary } from './personalDetails'
import { ActivityCount, Compliance, Offence, Order, PreviousOrders } from './overview'

export interface PersonCompliance {
  personSummary: PersonSummary
  previousOrders: PreviousOrders
  currentSentences: SentenceCompliance[]
}

export interface SentenceCompliance {
  eventNumber: string
  activity: ActivityCount
  compliance: Compliance
  mainOffence: Offence
  order: Order
  activeBreach?: BreachOrRecall
  activeRecall?: BreachOrRecall
  rarDescription?: string
}

export interface BreachOrRecall {
  startDate: string
  status: string
}

export { ContactType, NonComplianceContact, NonComplianceHistoryResponse } from './overview'
