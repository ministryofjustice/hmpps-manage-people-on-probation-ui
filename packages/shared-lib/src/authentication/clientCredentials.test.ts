import generateOauthClientToken from './clientCredentials'
import { getConfig } from '../config'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

const mockConfig: any = {
  apis: {
    hmppsAuth: {
      apiClientId: '1234',
      apiClientSecret: '5678',
    },
  },
}

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockGetConfig.mockReturnValue(mockConfig)

describe('generateOauthClientToken', () => {
  it('Token can be generated', () => {
    expect(generateOauthClientToken('bob', 'password1')).toBe('Basic Ym9iOnBhc3N3b3JkMQ==')
  })

  it('Token can be generated with special characters', () => {
    const value = generateOauthClientToken('bob', "p@'s&sw/o$+ rd1")
    const decoded = Buffer.from(value.substring(6), 'base64').toString('utf-8')

    expect(decoded).toBe("bob:p@'s&sw/o$+ rd1")
  })
})
