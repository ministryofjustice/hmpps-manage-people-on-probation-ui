import httpMocks from 'node-mocks-http'
import { getAppointmentTypes } from './getAppointmentTypes'
import { HmppsAuthClient } from '../data'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { AppointmentTypeResponse } from '../models/Appointments'
import { AppResponse } from '../models/Locals'

const token = { access_token: 'token-1', expires_in: 300 }
const username = 'user-1'
jest.mock('../data/tokenStore/redisTokenStore')
const tokenSpy = jest
  .spyOn(HmppsAuthClient.prototype, 'getSystemClientToken')
  .mockImplementation(() => Promise.resolve(token.access_token))
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
tokenStore.getToken.mockResolvedValue(token.access_token)

const appointmentTypesMock = {
  appointmentTypes: [
    {
      code: 'C084',
      description: '3 Way Meeting (NS)',
      isPersonLevelContact: false,
      isLocationRequired: true,
    },
    {
      code: 'CHVS',
      description: 'Home Visit to Case (NS)',
      isPersonLevelContact: false,
      isLocationRequired: false,
    },
  ],
} as unknown as AppointmentTypeResponse

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const res = {
  locals: {
    user: {
      username,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

const spy = jest
  .spyOn(MasApiClient.prototype, 'getAppointmentTypes')
  .mockImplementation(() => Promise.resolve(appointmentTypesMock))

describe('middleware/getAppointmentTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('No appointment types session defined', () => {
    let req: httpMocks.MockRequest<any>
    beforeEach(async () => {
      req = httpMocks.createRequest({
        session: {
          data: {
            sentences: {},
          },
        },
      })
      await getAppointmentTypes(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should get client token', () => {
      expect(tokenSpy).toHaveBeenCalledWith(username)
    })
    it('should request the appointment types from the api', () => {
      expect(spy).toHaveBeenCalled()
    })
    it('should add the response to the session', () => {
      const expected = {
        ...req.session.data,
        appointmentTypes: appointmentTypesMock.appointmentTypes,
      }
      expect(req.session.data).toEqual(expected)
    })
    it('should add response to res.locals', () => {
      expect(res.locals.appointmentTypes).toEqual(appointmentTypesMock.appointmentTypes)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('Appointment types session is defined', () => {
    const req = httpMocks.createRequest({
      session: {
        data: {
          appointmentTypes: appointmentTypesMock.appointmentTypes,
        },
      },
    })
    beforeEach(async () => {
      await getAppointmentTypes(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should not make an api request', () => {
      expect(spy).not.toHaveBeenCalled()
    })
    it('should add response to res.locals', () => {
      expect(res.locals.appointmentTypes).toEqual(req.session.data.appointmentTypes)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
