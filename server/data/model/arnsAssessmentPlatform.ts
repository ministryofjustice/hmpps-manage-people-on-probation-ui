// Request types

export interface QueryUser {
  id: string
  name: string
  authSource: string
}

export interface ExternalIdentifier {
  type: 'EXTERNAL'
  identifier: string
  identifierType: string
  assessmentType: string
}

export interface AssessmentVersionQuery {
  type: 'AssessmentVersionQuery'
  user: QueryUser
  assessmentIdentifier: ExternalIdentifier
}

export interface QueriesRequest {
  queries: AssessmentVersionQuery[]
}

// Response types

export interface SingleValue {
  type: 'Single'
  value: string
}

export interface MultiValue {
  type: 'Multi'
  values: string[]
}

export type Values = SingleValue | MultiValue

export interface CollectionItem {
  uuid: string
  createdAt: string
  updatedAt: string
  properties: Record<string, Values>
}

export interface Collection {
  uuid: string
  createdAt: string
  updatedAt: string
  name: string
  items: CollectionItem[]
}

export interface AssessmentVersionQueryResult {
  type: 'AssessmentVersionQueryResult'
  assessmentUuid: string
  updatedAt: string
  collections: Collection[]
}

export interface QueryResponse {
  result: AssessmentVersionQueryResult | null
}

export interface QueriesResponse {
  queries: QueryResponse[]
}

// Result type returned to the middleware

export interface SentencePlanResult {
  hasAgreedPlan: boolean
  lastUpdatedDate: string
}

// Helpers

export function unwrapSingleValue(wrapped: Values | undefined): string | undefined {
  if (!wrapped) {
    return undefined
  }

  return wrapped.type === 'Single' ? wrapped.value : undefined
}
