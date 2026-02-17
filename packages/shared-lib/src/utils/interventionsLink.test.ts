import { interventionsLink } from './interventionsLink'
import config from '../config'

describe('utils/interventionsLink', () => {
  const referralId = '1234'
  it.each([
    ['an empty string if referral id is null', null, ''],
    ['an empty string if referral id is undefined', undefined, ''],
    ['an empty string if referral id is an empty string', undefined, ''],
    [
      'the interventions link',
      referralId,
      `${config.interventions.link}/probation-practitioner/referrals/${referralId}/progress`,
    ],
  ])('should return %s', (_: string, a: string, expected: string) => {
    expect(interventionsLink(a)).toEqual(expected)
  })
})
