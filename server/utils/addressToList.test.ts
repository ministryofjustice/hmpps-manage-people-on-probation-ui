import { addressToList } from './addressToList'

const mockAddress = {
  officeName: 'Office name',
  buildingName: 'The Building',
  buildingNumber: '77',
  streetName: 'Some Street',
  district: 'Some City Centre',
  town: 'London',
  ldu: 'LDU',
  county: 'Essex',
  postcode: 'NW10 1EP',
}

const getMockAddress = (withoutKey: string): Record<string, string> => {
  return Object.fromEntries(Object.entries(mockAddress).filter(([k, _v]) => k !== withoutKey))
}

const getExpected = (withoutKey: string): string[] => {
  const address = getMockAddress(withoutKey)
  const buildingNumber = address?.buildingNumber ? `${address.buildingNumber} ` : ''
  return Object.entries(address).reduce((acc, [k, v]) => {
    if (!['buildingNumber', 'streetName'].includes(k)) {
      return [...acc, v]
    }
    if (k === 'streetName') {
      return [...acc, `${buildingNumber}${mockAddress.streetName}`]
    }
    return acc
  }, [])
}

describe('addressToList', () => {
  for (const withoutKey of Object.keys(mockAddress)) {
    it(`should return an address array without ${withoutKey}`, () => {
      expect(addressToList(getMockAddress(withoutKey))).toEqual(getExpected(withoutKey))
    })
  }
  it('should return the address array without postcode', () => {
    expect(addressToList(mockAddress, true)).toEqual(getExpected('postcode'))
  })
})
