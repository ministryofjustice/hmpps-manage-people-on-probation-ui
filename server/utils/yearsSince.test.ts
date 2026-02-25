import { yearsSince } from '.'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

describe('utils/yearsSince', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '1998-05-25T09:08:34.123', yearsSince('1998-05-25T09:08:34.123')],
  ])('%s yearsSince(%s, %s)', (_: string, a: string, expected: string) => {
    expect(yearsSince(a)).toEqual(expected)
  })
})
