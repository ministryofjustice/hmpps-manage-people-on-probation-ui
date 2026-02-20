import { oaSysUrl } from './oaSysUrl'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/oaSysUrl', () => {
  it.each([['Get link', 'https://oasys-dummy-url']])('%s oaSysUrl()', (_: string, expected: string) => {
    expect(oaSysUrl()).toEqual(expected)
  })
})
