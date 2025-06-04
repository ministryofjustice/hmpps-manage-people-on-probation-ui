import { Name } from './personalDetails'

export interface ProfessionalContact {
  name: Name
  currentContacts: Contact[]
  previousContacts: Contact[]
}

export interface Contact {
  name: string
  telephoneNumber: string
  email: string
  provider: string
  probationDeliveryUnit: string
  team: string
  allocationDate: string
  allocatedUntil?: string
  responsibleOfficer: boolean
  prisonOffenderManager: boolean
}
