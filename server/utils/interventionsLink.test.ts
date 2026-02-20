import { interventionsLink } from './interventionsLink'
import config from '../config'

jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib')

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    preservedWords: [] as string[],
    preservedSeparators: [] as string[],
    validMimeTypes: {} as Record<string, string>,
    apis: {
      masApi: {
        pageSize: 10,
      },
    },
    interventions: {
      link: '',
    },
  },
}))

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
