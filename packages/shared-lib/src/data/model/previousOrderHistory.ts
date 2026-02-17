import { Name } from './personalDetails'

export interface PreviousOrderHistory {
  name: Name
  previousOrders: PreviousOrder[]
}

export interface PreviousOrder {
  eventNumber: string
  title: string
  description: string
  terminationDate: string
}
