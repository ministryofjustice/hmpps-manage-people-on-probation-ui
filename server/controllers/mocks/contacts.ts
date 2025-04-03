import { ProfessionalContact } from '../../data/model/professionalContact'

export const mockContacts = {
  name: {
    forename: 'Eula',
    middleName: '',
    surname: 'Schmeler',
  },
  currentContacts: [
    {
      name: 'Arhsimna Xolfo',
      email: 'arhsimna.xolfo@moj.gov.uk',
      telephoneNumber: '07321165373',
      provider: 'London',
      probationDeliveryUnit: 'All London',
      team: 'Unallocated Team (N07)',
      allocationDate: '2025-04-22',
      responsibleOfficer: true,
      prisonOffenderManager: false,
    },
  ],
  previousContacts: [
    {
      name: 'Yrhreender Hanandra',
      role: 'Community Offender Manager (COM)',
      email: 'yrhreender.hanandra@moj.gov.uk',
      telephoneNumber: '07321165373',
      provider: 'London',
      probationDeliveryUnit: 'All London',
      team: 'Unallocated Team (N07)',
      allocationDate: '2025-04-21',
      allocatedUntil: '2025-04-22',
      responsibleOfficer: false,
      prisonOffenderManager: false,
    },
  ],
} as unknown as ProfessionalContact
