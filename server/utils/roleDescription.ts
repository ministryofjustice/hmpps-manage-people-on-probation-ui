import { Contact } from '../data/model/professionalContact'

export const roleDescription = (contact: Contact, addBreak?: boolean): string => {
  const breakTag = addBreak ? '<br>' : ' '
  const responsibleOfficer = contact.responsibleOfficer ? `${breakTag}(responsible officer)` : ''
  return contact.prisonOffenderManager
    ? `prison offender manager (POM)${responsibleOfficer}`
    : `probation practitioner${responsibleOfficer}`
}
