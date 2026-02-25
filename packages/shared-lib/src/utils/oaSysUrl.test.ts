import { oaSysUrl } from './oaSysUrl'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockLink = 'https://oasys-dummy-url'

const mockedConfig = {
  oaSys: {
    link: mockLink,
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('utils/oaSysUrl', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })
  it.each([['Get link', mockLink]])('%s oaSysUrl()', (_: string, expected: string) => {
    expect(oaSysUrl()).toEqual(expected)
  })
})
