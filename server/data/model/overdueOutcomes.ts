export interface ContactResponse {
  content: Contact[]
}

export interface Contact {
  id: number
  externalReference?: string
  type: ContactType
  date: string
  start: string
  end?: string
}

export interface ContactType {
  code: string
  description: string
}
