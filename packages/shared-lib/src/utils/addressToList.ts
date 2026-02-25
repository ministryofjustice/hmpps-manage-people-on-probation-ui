import { Address } from '../data/model/personalDetails'

export const addressToList = (address: Address, hidePostcode: boolean = false): string[] => {
  const addressArray: string[] = []
  let buildingNumber = ''
  if (address?.officeName) {
    addressArray.push(address?.officeName)
  }
  if (address?.buildingName) {
    addressArray.push(address?.buildingName)
  }
  if (address?.buildingNumber) {
    buildingNumber = `${address?.buildingNumber} `
  }
  if (address?.streetName) {
    addressArray.push(`${buildingNumber}${address?.streetName}`)
  }
  if (address?.district) {
    addressArray.push(address?.district)
  }
  if (address?.town) {
    addressArray.push(address?.town)
  }
  if (address?.ldu) {
    addressArray.push(address?.ldu)
  }
  if (address?.county) {
    addressArray.push(address?.county)
  }
  if (address?.postcode && hidePostcode === false) {
    addressArray.push(address?.postcode)
  }
  return addressArray
}
