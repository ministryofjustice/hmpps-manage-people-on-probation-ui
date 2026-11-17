import { tierLink } from './tierLink'

describe('utils/tierLink', () => {
  it('should return the tier link when tierLink is called with a crn', () => {
    expect(tierLink('X000001')).toEqual('https://tier-dummy-url/X000001')
  })

  it('should return an empty string when tierLink is called with a null crn', () => {
    expect(tierLink(null)).toEqual('')
  })
})
