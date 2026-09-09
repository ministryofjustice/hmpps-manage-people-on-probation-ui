import { Contact, ProfessionalContact } from '../data/model/personalDetails'
import { getManagedByDetails } from './getManagedByDetails'

const CRN = 'X988001'
const STAFF_CONTACTS_HREF = `/case/${CRN}/personal-details/staff-contacts`

const contact = (overrides: Partial<Contact> = {}): Contact =>
  ({
    name: 'Jack Frost',
    telephoneNumber: '',
    email: '',
    provider: 'East Midlands',
    probationDeliveryUnit: 'Worksop',
    team: 'Worksop Team',
    allocationDate: '2026-01-01',
    responsibleOfficer: true,
    prisonOffenderManager: false,
    ...overrides,
  }) as Contact

const professionalContact = (currentContacts: Contact[]): ProfessionalContact =>
  ({
    name: { forename: 'Andrew', surname: 'Langley' },
    currentContacts,
    previousContacts: [],
  }) as unknown as ProfessionalContact

describe('utils/getManagedByDetails', () => {
  it('returns "No data available" with no href when professionalContact is null', () => {
    expect(getManagedByDetails(CRN, null)).toEqual({ text: 'No data available' })
  })

  it('returns "Unallocated" with no href when there are no current contacts', () => {
    expect(getManagedByDetails(CRN, professionalContact([]))).toEqual({ text: 'Unallocated' })
  })

  it('returns the COM name with PDU in brackets, linked to staff contacts', () => {
    const result = getManagedByDetails(CRN, professionalContact([contact()]))

    expect(result).toEqual({ text: 'Jack Frost (Worksop)', href: STAFF_CONTACTS_HREF })
  })

  it('returns just the COM name, no brackets, when there is no PDU', () => {
    const result = getManagedByDetails(CRN, professionalContact([contact({ probationDeliveryUnit: '' })]))

    expect(result).toEqual({ text: 'Jack Frost', href: STAFF_CONTACTS_HREF })
  })

  it('falls back to the POM name, with no brackets, when there is no COM', () => {
    const result = getManagedByDetails(
      CRN,
      professionalContact([contact({ name: 'Karuna Kanumuri', prisonOffenderManager: true })]),
    )

    expect(result).toEqual({ text: 'Karuna Kanumuri', href: STAFF_CONTACTS_HREF })
  })

  it('prefers the COM over the POM when both exist', () => {
    const result = getManagedByDetails(
      CRN,
      professionalContact([
        contact({ name: 'Karuna Kanumuri', prisonOffenderManager: true }),
        contact({ name: 'Jack Frost', prisonOffenderManager: false }),
      ]),
    )

    expect(result.text).toBe('Jack Frost (Worksop)')
  })

  it('prefers the responsible officer among multiple COM-type contacts', () => {
    const result = getManagedByDetails(
      CRN,
      professionalContact([
        contact({ name: 'Other Contact', responsibleOfficer: false }),
        contact({ name: 'Jack Frost', responsibleOfficer: true }),
      ]),
    )

    expect(result.text).toBe('Jack Frost (Worksop)')
  })

  it('ignores contacts flagged as unallocated', () => {
    const result = getManagedByDetails(CRN, professionalContact([contact({ isUnallocated: true })]))

    expect(result).toEqual({ text: 'Unallocated' })
  })
})
