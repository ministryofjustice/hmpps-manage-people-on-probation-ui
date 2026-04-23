import { PersonSummary } from './personalDetails'
import { ActivityCount, Compliance, Offence, Order, PreviousOrders } from './overview'

export interface PersonCompliance {
  personSummary: PersonSummary
  currentSentences: SentenceCompliance[]
  previousOrders: PreviousOrders
}

export interface SentenceCompliance {
  eventNumber: string
  mainOffence: Offence
  order: Order
  activeBreach?: Breach
  rarDescription?: string
  rarCategory?: string
  compliance: Compliance
  activity: ActivityCount
}

export interface Breach {
  startDate: string
  status: string
}
