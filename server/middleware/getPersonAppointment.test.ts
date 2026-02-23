import httpMocks from 'node-mocks-http'
import { HmppsAuthClient } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { getPersonAppointment } from './getPersonAppointment'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, mockPersonAppointment } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const contactId = '12345'
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
const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const nextSpy = jest.fn()

const req = httpMocks.createRequest({ params: { crn, contactId } })
const res = mockAppResponse()

describe('middleware/getPersonAppointment', () => {
  beforeEach(async () => {
    await getPersonAppointment(hmppsAuthClient)(req, res, nextSpy)
  })
  it('should request the person appointment from the api', async () => {
    expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, contactId)
  })
  it('should assign the response to res.locals.personAppointment', () => {
    expect(res.locals.personAppointment).toEqual(mockPersonAppointment)
  })
})
