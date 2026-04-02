import { Contact } from '../data/model/professionalContact'
import { roleDescription } from './roleDescription'

const mockContact = {
  responsibleOfficer: true,
  prisonOffenderManager: true,
} as Contact

describe('utils/roleDescription', () => {
  it('should return the correct format with break tag if contact is responsible officer and prison offender manager', () => {
    expect(roleDescription(mockContact, true)).toEqual(`prison offender manager (POM)<br>(responsible officer)`)
  })
  it('should return the correct format with no break tag if contact is responsible officer and prison offender manager', () => {
    expect(roleDescription(mockContact, false)).toEqual(`prison offender manager (POM) (responsible officer)`)
  })
  it('should return the correct format with no break tag if contact is prison offender manager but not responsible officer', () => {
    expect(roleDescription({ ...mockContact, responsibleOfficer: false }, false)).toEqual(
      `prison offender manager (POM)`,
    )
  })
  it('should return the correct format with no break tag if contact is neither a prison offender manager or a responsible officer', () => {
    expect(roleDescription({ responsibleOfficer: false, prisonOffenderManager: false } as Contact, false)).toEqual(
      `probation practitioner`,
    )
  })
  it('should return the correct format with no break tag if contact is a responsible officer but not a prison offender manager', () => {
    expect(roleDescription({ ...mockContact, prisonOffenderManager: false }, true)).toEqual(
      `probation practitioner<br>(responsible officer)`,
    )
  })
})
