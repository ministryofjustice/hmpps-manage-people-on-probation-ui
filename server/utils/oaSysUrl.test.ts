import { oaSysUrl } from './oaSysUrl'

describe('utils/oaSysUrl', () => {
  it.each([['Get link', 'https://oasys-dummy-url']])('%s oaSysUrl()', (_: string, expected: string) => {
    expect(oaSysUrl()).toEqual(expected)
  })
})
