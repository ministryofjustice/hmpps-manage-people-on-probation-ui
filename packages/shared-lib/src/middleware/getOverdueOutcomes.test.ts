import httpMocks from 'node-mocks-http'
import { getOverdueOutcomes } from './getOverdueOutcomes'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'
import { mockOverdueOutcomes } from '../controllers/mocks/mockOverdueOutcomes'
import { getConfig } from '../config'

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const crn = 'X000001'

const getOverdueOutcomesSpy = jest
  .spyOn(MasApiClient.prototype, 'getOverdueOutcomes')
  .mockImplementation(() => Promise.resolve(mockOverdueOutcomes))

const nextSpy = jest.fn()
const req = httpMocks.createRequest({ params: { crn } })
const res = mockAppResponse()

jest.mock('../config', () => {
  const actualConfig = jest.requireActual('../config')
  return {
    ...actualConfig,
    getConfig: jest.fn(),
  }
})

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>

// Provide a fake config for tests
const fakeConfig = {
  apis: {
    hmppsAuth: {
      url: 'http://fake-hmpps-auth',
      timeout: 5000,
      systemClientId: 'client-id',
      systemClientSecret: 'client-secret',
    },
  },
}

mockedGetConfig.mockReturnValue(fakeConfig)

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('middleware/getPersonSchedule', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await getOverdueOutcomes(hmppsAuthClient)(req, res, nextSpy)
  })

  it('should request overdue outcomes from the API', async () => {
    expect(getOverdueOutcomesSpy).toHaveBeenCalledWith(crn)
  })

  it('should assign the response to res.locals.contactResponse', () => {
    expect(res.locals.contactResponse).toEqual(mockOverdueOutcomes)
  })

  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})
