import { toSlug } from './toSlug'

describe('utils/toSlug', () => {
  it('should return a lower case slug string', () => {
    expect(toSlug('A String To Be Converted to A slug')).toEqual('a-string-to-be-converted-to-a-slug')
  })
})
