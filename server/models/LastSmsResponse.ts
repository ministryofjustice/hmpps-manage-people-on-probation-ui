type LastSmsStatus = 'DELIVERED' | 'NOT_DELIVERED' | 'PENDING'

export interface LastSmsResponse {
  dateSent: string
  dateDelivered: string | null
  dateRetryUntil: string | null
}
