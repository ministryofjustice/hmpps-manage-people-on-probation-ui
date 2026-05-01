import { supervisionContactsAddLink } from './supervisionContactsLink'
import config from '../config'

describe('utils/supervisionContactsLink', () => {
  const crn = 'X793504'
  it.each([
    ['an empty string if crn is null', null, ''],
    ['an empty string if crn is undefined', undefined, ''],
    ['an empty string if crn is an empty string', '', ''],
    [
      'the supervision contacts add link',
      crn,
      `${config.supervisionContacts.link}/case/${crn}/add-frequently-used-contact`,
    ],
  ])('should return %s', (_: string, a: string, expected: string) => {
    expect(supervisionContactsAddLink(a)).toEqual(expected)
  })
})
