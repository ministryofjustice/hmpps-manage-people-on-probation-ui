import { PersonSummary } from './personalDetails'
import {
  ActivityCount,
  Compliance,
  ContactType,
  NonComplianceContact,
  NonComplianceHistoryResponse,
  Offence,
  Order,
  PreviousOrders,
} from './overview'

export { ContactType, NonComplianceContact, NonComplianceHistoryResponse }

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
