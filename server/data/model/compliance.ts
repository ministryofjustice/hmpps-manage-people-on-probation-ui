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
  activeBreach?: Breach
  rarDescription?: string
}

export interface Breach {
  startDate: string
  status: string
}
