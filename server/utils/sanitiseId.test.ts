import { sanitiseId } from './sanitiseId'

describe('utils/sanitiseId', () => {
  it('should sanitise an array of ids', () => {
    const ids = ['//some/id', '//:some/other/id', '1234abcd']
    expect(sanitiseId(ids)).toEqual(['someid', 'someotherid', '1234abcd'])
  })
  it('should sanitise a single id value', () => {
    expect(sanitiseId('//some/id')).toEqual('someid')
  })
})
