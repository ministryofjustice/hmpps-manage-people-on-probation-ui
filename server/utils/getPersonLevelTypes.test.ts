import { AppointmentType } from '../models/Appointments'
import { getPersonLevelTypes } from './getPersonLevelTypes'

describe('getPersonLevelTypes()', () => {
  it('should return an empty array if no data', () => {
    expect(getPersonLevelTypes(null)).toEqual([])
  })
  it('should return filtered types', () => {
    const mockTypes: AppointmentType[] = [
      {
        code: 'C084',
        description: '3 Way Meeting (NS)',
        isPersonLevelContact: false,
        isLocationRequired: true,
      },
      {
        code: 'CODC',
        description: 'Planned Doorstep Contact (NS)',
        isPersonLevelContact: true,
        isLocationRequired: true,
      },
    ]
    expect(getPersonLevelTypes(mockTypes)).toEqual(mockTypes.filter(type => type?.isPersonLevelContact === true))
  })
})
