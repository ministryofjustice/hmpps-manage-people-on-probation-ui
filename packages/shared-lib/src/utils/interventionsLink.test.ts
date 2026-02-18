import { interventionsLink } from './interventionsLink'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockedConfig = {
  interventions: {
    link: 'https://interventions-dummy-url',
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('utils/interventionsLink', () => {
  const referralId = '1234'
  it.each([
    ['an empty string if referral id is null', null, ''],
    ['an empty string if referral id is undefined', undefined, ''],
    ['an empty string if referral id is an empty string', undefined, ''],
    [
      'the interventions link',
      referralId,
      `${mockedConfig.interventions.link}/probation-practitioner/referrals/${referralId}/progress`,
    ],
  ])('should return %s', (_: string, a: string, expected: string) => {
    expect(interventionsLink(a)).toEqual(expected)
  })
})
