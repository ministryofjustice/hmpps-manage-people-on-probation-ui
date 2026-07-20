import { tierLink, tierUrlV3 } from './tierLink'

describe('utils/tierLink', () => {
  it('should return the v3 tier url when tierUrlV3 is called with a crn', () => {
    expect(tierUrlV3('X000001')).toEqual('https://tier-dummy-url/v3/case/X000001')
  })

  it('should return an empty string when tierUrlV3 is called with an empty crn', () => {
    expect(tierUrlV3('')).toEqual('')
  })

  it('should return the tier link when tierLink is called with a crn', () => {
    expect(tierLink('X000001')).toEqual('https://tier-dummy-url/X000001')
  })

  it('should return an empty string when tierLink is called with a null crn', () => {
    expect(tierLink(null)).toEqual('')
  })
})
