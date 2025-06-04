import { PersonSummary } from './personalDetails'

export interface PersonDocuments {
  personSummary: PersonSummary
  totalPages: number
  totalElements: number
  pageSize: number
  sortedBy: string
  documents: Document[]
  metadata?: DocumentMetadata
}

export interface DocumentMetadata {
  documentLevels?: DocumentLevel[]
}

export interface SearchDocumentsRequest {
  name?: string
  dateFrom?: string
  dateTo?: string
}

export interface DocumentLevel {
  code?: string
  description?: string
}

export interface TextSearchDocumentsRequest {
  query?: string
  levelCode?: string
  dateFrom?: string
  dateTo?: string
}

export interface Document {
  alfrescoId: string
  name: string
  filenameHighlighted?: string
  docLevel: string
  tableName: string
  createdAt: string
  lastUpdatedAt: string
  author: string
  description: string
}
