export interface ContactResponse {
  content: ContactContent[]
}

export interface ContactContent {
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
