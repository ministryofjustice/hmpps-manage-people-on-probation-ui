import httpMocks from 'node-mocks-http'
import evaluateFeatureFlags from './evaluateFeatureFlags'
import FlagService from '../services/flagService'
import logger from '../../logger'
import { AppResponse } from '../models/Locals'

const mockFlags = {
  enableNavOverview: true,
  enableNavAppointments: true,
  enableNavPersonalDetails: true,
  enableNavRisk: true,
  enableNavSentence: true,
  enableNavActivityLog: true,
  enableNavCompliance: true,
  enableNavInterventions: true,
  enableAppointmentCreate: true,
  enableContactLog: true,
}
jest.mock('../services/flagService')

describe('/middleware/evaluateFeatureFlags', () => {
  const req = httpMocks.createRequest()
  const res = {
    locals: {
      user: {
        username: 'user-1',
      },
    },
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse

  afterEach(() => {
    jest.clearAllMocks()
  })
  const nextSpy = jest.fn()

  describe('Flags returned', () => {
    const getFlagsSpy = jest
      .spyOn(FlagService.prototype, 'getFlags')
      .mockImplementationOnce(() => Promise.resolve(mockFlags))
    beforeEach(async () => {
      const flagService = new FlagService()
      await evaluateFeatureFlags(flagService)(req, res, nextSpy)
    })
    it('should call FlagService.getFlags()', () => {
      expect(getFlagsSpy).toHaveBeenCalled()
    })
    it('should assign the flags to res.locals.flags', () => {
      expect(res.locals.flags).toEqual(mockFlags)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('No flags returned', () => {
    const loggerSpy = jest.spyOn(logger, 'info')
    beforeEach(async () => {
      jest.spyOn(FlagService.prototype, 'getFlags').mockImplementationOnce(() => Promise.resolve(null))
      const flagService = new FlagService()
      await evaluateFeatureFlags(flagService)(req, res, nextSpy)
    })
    it('should log info', () => {
      expect(loggerSpy).toHaveBeenCalledWith('No flags available')
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('Response error', () => {
    const loggerSpy = jest.spyOn(logger, 'error')
    const mockError = new Error('Error message')
    beforeEach(async () => {
      jest.spyOn(FlagService.prototype, 'getFlags').mockImplementationOnce(() => Promise.reject(mockError))
      const flagService = new FlagService()
      await evaluateFeatureFlags(flagService)(req, res, nextSpy)
    })
    it('should log the error', () => {
      expect(loggerSpy).toHaveBeenCalledWith(mockError, `Failed to retrieve flipt feature flags`)
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledWith(mockError)
    })
  })

  describe('enableDeliusClient query parameter', () => {
    it('should override enableDeliusClient to true when query parameter is "true"', async () => {
      const reqWithQuery = httpMocks.createRequest({
        query: { enableDeliusClient: 'true' },
      })
      const flagsWithDeliusDisabled = { ...mockFlags, enableDeliusClient: false }
      jest
        .spyOn(FlagService.prototype, 'getFlags')
        .mockImplementationOnce(() => Promise.resolve(flagsWithDeliusDisabled))
      const flagService = new FlagService()

      await evaluateFeatureFlags(flagService)(reqWithQuery, res, nextSpy)

      expect(res.locals.flags.enableDeliusClient).toBe(true)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('should override enableDeliusClient to false when query parameter is "false"', async () => {
      const reqWithQuery = httpMocks.createRequest({
        query: { enableDeliusClient: 'false' },
      })
      const flagsWithDeliusEnabled = { ...mockFlags, enableDeliusClient: true }
      jest
        .spyOn(FlagService.prototype, 'getFlags')
        .mockImplementationOnce(() => Promise.resolve(flagsWithDeliusEnabled))
      const flagService = new FlagService()

      await evaluateFeatureFlags(flagService)(reqWithQuery, res, nextSpy)

      expect(res.locals.flags.enableDeliusClient).toBe(false)
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
