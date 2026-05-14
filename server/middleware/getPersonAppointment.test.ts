import httpMocks from 'node-mocks-http'
import { getPersonAppointment } from './getPersonAppointment'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { mockAppResponse, mockPersonAppointment } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const contactId = '12345'
const id = 'd2d6aac0-5112-4c82-b196-c8b780a010d0'
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')
const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const nextSpy = jest.fn()

const res = mockAppResponse()

describe('middleware/getPersonAppointment', () => {
  describe('contactId in url params', () => {
    const req = httpMocks.createRequest({ params: { crn, contactId } })
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
  describe('Reschedule appointment - contactId in session', () => {
    const req = httpMocks.createRequest({
      params: { crn, id },
      session: { data: { appointments: { [crn]: { [id]: { rescheduleAppointment: { contactId } } } } } },
    })
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
})
