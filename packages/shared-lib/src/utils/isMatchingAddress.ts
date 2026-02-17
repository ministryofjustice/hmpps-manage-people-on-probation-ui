import { Address } from '../data/model/personalDetails'

export const isMatchingAddress = (address1?: Address, address2?: Address): boolean => {
  const addressKeys = [
    'officeName',
    'buildingName',
    'buildingNumber',
    'streetName',
    'district',
    'town',
    'county',
    'postcode',
  ]
  if (!address1 && !address2) return true
  if (address1 && !address2) return false
  if (!address1 && address2) return false
  for (const key of addressKeys) {
    if (address1?.[key as keyof Address] !== address2?.[key as keyof Address]) {
      return false
    }
  }
  return true
}
