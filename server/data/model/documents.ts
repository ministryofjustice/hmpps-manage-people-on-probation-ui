import { PersonSummary } from './common'

export interface PersonDocuments {
  personSummary: PersonSummary
  totalPages: number
  totalElements: number
  pageSize: number
  sortedBy: string
  documents: Document[]
}

export interface SearchDocumentsRequest {
  name?: string
  dateFrom?: string
  dateTo?: string
}

export interface Document {
  alfrescoId: string
  name: string
  docLevel: string
  tableName: string
  createdAt: string
  lastUpdatedAt: string
  author: string
  description: string
}
