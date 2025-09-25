import httpMocks from 'node-mocks-http'
import { getPersonSchedule } from './getPersonSchedule'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, mockPersonSchedule } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const getPersonScheduleSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonSchedule')
  .mockImplementation(() => Promise.resolve(mockPersonSchedule))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const nextSpy = jest.fn()

const req = httpMocks.createRequest({ params: { crn } })
const res = mockAppResponse()

describe('middleware/getPersonSchedule', () => {
  beforeEach(async () => {
    await getPersonSchedule(hmppsAuthClient)(req, res, nextSpy)
  })
  it('should request the person schedule from the api', async () => {
    expect(getPersonScheduleSpy).toHaveBeenCalledWith(crn, 'previous', '0')
  })
  it('should assign the response to res.locals.personSchedule', () => {
    expect(res.locals.personSchedule).toEqual(mockPersonSchedule.personSchedule)
  })
  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})
