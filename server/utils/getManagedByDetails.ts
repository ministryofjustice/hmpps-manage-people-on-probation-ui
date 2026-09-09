import { Contact, ProfessionalContact } from '../data/model/personalDetails'

export interface ManagedByDetails {
  text: string
  href?: string
}

const isRealContact = (contact: Contact): boolean => !contact.isUnallocated

const preferResponsibleOfficer = (contacts: Contact[]): Contact | undefined =>
  contacts.find(contact => contact.responsibleOfficer) ?? contacts[0]

export const getManagedByDetails = (crn: string, professionalContact: ProfessionalContact | null): ManagedByDetails => {
  if (!professionalContact) {
    return { text: 'No data available' }
  }

  const contacts = (professionalContact.currentContacts ?? []).filter(isRealContact)
  const href = `/case/${crn}/personal-details/staff-contacts`

  const com = preferResponsibleOfficer(contacts.filter(contact => !contact.prisonOffenderManager))
  if (com) {
    const location = com.probationDeliveryUnit ? ` (${com.probationDeliveryUnit})` : ''
    return { text: `${com.name}${location}`, href }
  }

  const pom = preferResponsibleOfficer(contacts.filter(contact => contact.prisonOffenderManager))
  if (pom) {
    return { text: pom.name, href }
  }

  return { text: 'Unallocated' }
}
