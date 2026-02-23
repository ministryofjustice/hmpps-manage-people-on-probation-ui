import httpMocks from 'node-mocks-http'
import { HmppsAuthClient } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { getOverdueOutcomes } from './getOverdueOutcomes'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse } from '../controllers/mocks'
import { mockOverdueOutcomes } from '../controllers/mocks/mockOverdueOutcomes'

jest.mock('../data/masApiClient')
jest.mock('@ministryofjustice/manage-people-on-probation-shared-lib', () => {
  return {
    HmppsAuthClient: jest.fn().mockImplementation(() => ({
      getSystemClientToken: jest.fn(),
    })),
    AgentConfig: jest.fn(),
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }
})
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
