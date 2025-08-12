import { Address } from '../data/model/personalDetails'
import { isMatchingAddress } from './isMatchingAddress'

describe('utils/isMatchingAddress', () => {
  const mockAddress: Address = {
    buildingName: 'The Building',
    buildingNumber: '77',
    streetName: 'Some Street',
    district: 'Some City Centre',
    town: 'London',
    county: 'Essex',
    postcode: 'NW10 1EP',
  }
  it('should accept 2 arguments', () => {
    expect(isMatchingAddress.length).toEqual(2)
  })
  it('should return true if both addresses are undefined', () => {
    expect(isMatchingAddress(undefined, undefined)).toEqual(true)
  })
  it('should return false if address1 is defined and address2 is undefined', () => {
    expect(isMatchingAddress(mockAddress, undefined)).toEqual(false)
  })
  it('should return false if address1 is undefined and address2 is defined', () => {
    expect(isMatchingAddress(undefined, mockAddress)).toEqual(false)
  })
  it('should return false if both addresses do not match', () => {
    const address2: Address = {
      ...mockAddress,
      buildingNumber: '78',
    }
    expect(isMatchingAddress(mockAddress, address2)).toEqual(false)
  })
  it('should return true if all address values match', () => {
    const address1: Address = {
      ...mockAddress,
      lastUpdated: '2023-03-14',
      lastUpdatedBy: {
        forename: 'Jim',
        surname: 'Smith',
      },
    }
    const address2: Address = {
      ...mockAddress,
      lastUpdated: '2023-04-18',
      lastUpdatedBy: {
        forename: 'Jim',
        surname: 'Smith',
      },
    }
    expect(isMatchingAddress(address1, address2)).toEqual(true)
  })
  it('should return true if both addresses match', () => {
    expect(isMatchingAddress(mockAddress, mockAddress)).toEqual(true)
  })
})
