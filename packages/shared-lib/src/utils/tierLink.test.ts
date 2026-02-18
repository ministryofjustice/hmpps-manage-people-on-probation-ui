import { tierLink } from './tierLink'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockedConfig = {
  tier: {
    link: 'https://tier-dummy-url',
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('utils/tierLink', () => {
  it.each([
    ['Returns empty', null, ''],
    ['Returns link', 'X000001', 'https://tier-dummy-url/X000001'],
  ])('%s tierLink(%s, %s)', (_: string, a: string, expected: string) => {
    expect(tierLink(a)).toEqual(expected)
  })
})
