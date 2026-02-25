import { PersonSummary } from './personalDetails'
import { Offence } from './offences'
import { ActivityCount, Compliance, PreviousOrders } from './overview'
import { Order } from './sentenceDetails'

export interface PersonCompliance {
  personSummary: PersonSummary
  previousOrders: PreviousOrders
  currentSentences: SentenceCompliance[]
}

export interface SentenceCompliance {
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
