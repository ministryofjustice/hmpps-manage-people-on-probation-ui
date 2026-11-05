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

  describe('SPARKS', () => {
    const unsorted = [
      { code: 'B', description: 'Budgeting' },
      { code: 'A', description: 'Anger management' },
    ]
    const sorted = [unsorted[1], unsorted[0]]
    const req = httpMocks.createRequest({ params: { crn, contactId } })
    const run = async (isSparksAllowed: boolean, flags: Record<string, boolean>, sparks: unknown = unsorted) => {
      getPersonAppointmentSpy.mockResolvedValueOnce({
        ...mockPersonAppointment,
        appointment: { ...mockPersonAppointment.appointment, isSparksAllowed, sparks },
      } as never)
      const localRes = mockAppResponse({ flags })
      await getPersonAppointment(hmppsAuthClient)(req, localRes, nextSpy)
      return localRes.locals.personAppointment
    }

    it('should sort sparks by description when the flag is on and isSparksAllowed is true', async () => {
      const result = await run(true, { enableSparksAppointmentDetails: true })
      expect(result.appointment.sparks).toEqual(sorted)
    })

    it('should set sparks to an empty array when the appointment has none', async () => {
      const result = await run(true, { enableSparksAppointmentDetails: true }, null)
      expect(result.appointment.sparks).toEqual([])
    })

    it('should not sort sparks when the flag is off', async () => {
      const result = await run(true, { enableSparksAppointmentDetails: false })
      expect(result.appointment.sparks).toEqual(unsorted)
    })

    it('should not sort sparks when the flag is not set', async () => {
      const result = await run(true, {})
      expect(result.appointment.sparks).toEqual(unsorted)
    })

    it('should not sort sparks when isSparksAllowed is false', async () => {
      const result = await run(false, { enableSparksAppointmentDetails: true })
      expect(result.appointment.sparks).toEqual(unsorted)
      expect(result.appointment.isSparksAllowed).toBe(false)
    })

    it('should not sort sparks when enablePreSentence is false and isSparksAllowed is false', async () => {
      const result = await run(false, { enableSparksAppointmentDetails: true, enablePreSentence: false })
      expect(result.appointment.sparks).toEqual(unsorted)
    })

    it('should not mutate the api response when sorting sparks', async () => {
      const apiResponse = {
        ...mockPersonAppointment,
        appointment: { ...mockPersonAppointment.appointment, isSparksAllowed: true, sparks: [...unsorted] },
      }
      getPersonAppointmentSpy.mockResolvedValueOnce(apiResponse as never)
      const localRes = mockAppResponse({ flags: { enableSparksAppointmentDetails: true } })
      await getPersonAppointment(hmppsAuthClient)(req, localRes, nextSpy)
      expect(apiResponse.appointment.sparks).toEqual(unsorted)
    })

    it('should keep the other appointment fields when sorting sparks', async () => {
      const result = await run(true, { enableSparksAppointmentDetails: true })
      expect(result.appointment).toEqual({
        ...mockPersonAppointment.appointment,
        isSparksAllowed: true,
        sparks: sorted,
      })
      expect(result.personSummary).toEqual(mockPersonAppointment.personSummary)
    })

    it('should still apply the delius managed override when enablePreSentence is false and sparks are sorted', async () => {
      const result = await run(true, {
        enableSparksAppointmentDetails: true,
        enablePreSentence: false,
      })
      expect(result.appointment.sparks).toEqual(sorted)
      expect(result.appointment.deliusManaged).toBe(false)
    })
  })

  describe('Regression', () => {
    it('should call next', async () => {
      const localNext = jest.fn()
      const req = httpMocks.createRequest({ params: { crn, contactId } })
      await getPersonAppointment(hmppsAuthClient)(req, mockAppResponse(), localNext)
      expect(localNext).toHaveBeenCalledTimes(1)
    })

    it('should not call the api or set personAppointment when there is no contactId', async () => {
      getPersonAppointmentSpy.mockClear()
      const localRes = mockAppResponse()
      const req = httpMocks.createRequest({ params: { crn } })
      await getPersonAppointment(hmppsAuthClient)(req, localRes, nextSpy)
      expect(getPersonAppointmentSpy).not.toHaveBeenCalled()
      expect(localRes.locals.personAppointment).toBeUndefined()
    })

    it('should use the contactId from temp session data when not in params or reschedule', async () => {
      getPersonAppointmentSpy.mockClear()
      const req = httpMocks.createRequest({
        params: { crn, id },
        session: { data: { temp: { [crn]: { responseContactId: '999' } } } },
      })
      await getPersonAppointment(hmppsAuthClient)(req, mockAppResponse(), nextSpy)
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, '999')
    })

    it('should not throw and should call next when the api response is null and the SPARKS flag is on', async () => {
      getPersonAppointmentSpy.mockResolvedValueOnce(null)
      const localNext = jest.fn()
      const localRes = mockAppResponse({ flags: { enableSparksAppointmentDetails: true } })
      const req = httpMocks.createRequest({ params: { crn, contactId } })
      await expect(getPersonAppointment(hmppsAuthClient)(req, localRes, localNext)).resolves.not.toThrow()
      expect(localNext).toHaveBeenCalledTimes(1)
      expect(localRes.locals.personAppointment).toEqual({ appointment: undefined })
    })

    it('should not throw when the api response is null and the SPARKS flag is off', async () => {
      getPersonAppointmentSpy.mockResolvedValueOnce(null)
      const localNext = jest.fn()
      const localRes = mockAppResponse({ flags: { enableSparksAppointmentDetails: false } })
      const req = httpMocks.createRequest({ params: { crn, contactId } })
      await getPersonAppointment(hmppsAuthClient)(req, localRes, localNext)
      expect(localNext).toHaveBeenCalledTimes(1)
      expect(localRes.locals.personAppointment).toEqual({ appointment: undefined })
    })

    it('should leave the api response unchanged when the flag is off', async () => {
      const localRes = mockAppResponse({ flags: { enableSparksAppointmentDetails: false } })
      const req = httpMocks.createRequest({ params: { crn, contactId } })
      await getPersonAppointment(hmppsAuthClient)(req, localRes, nextSpy)
      expect(localRes.locals.personAppointment).toEqual(mockPersonAppointment)
    })
  })
})
