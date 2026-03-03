import { PersonSummary } from './personalDetails'

/**
 * Represents the Person on Probation details needed for the Contact journey headers.
 * Extends PersonSummary to ensure compatibility with existing summary endpoints,
 * while adding specific fields used in the Contact view templates (e.g. Tier, Risk).
 */
export interface PersonOnProbation extends PersonSummary {
  tier?: string
  rosh?: string
  rsr?: string
  age?: number
}

/**
 * Represents a Frequently Used Contact Type or a specific Contact Type detail.
 */
export interface ContactType {
  code: string
  description: string
  isPersonLevelContact: boolean
}

/**
 * The payload structure for creating a new contact.
 * This matches the JSON body expected by the API.
 */
export interface CreateContactRequest {
  staffCode: string
  teamCode: string
  type: string
  eventId?: number
  requirementId?: number
  description?: string
  notes?: string
  alert: boolean
  sensitive: boolean
  visorReport: boolean
}

export interface CreateContactResponse {
  id: number
}