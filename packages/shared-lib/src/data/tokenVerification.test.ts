import nock from 'nock'
import { Request } from 'express'
import verifyToken from './tokenVerification'
import { getConfig } from '../config'
import logger from '../logger'

jest.mock('../config', () => ({
  getConfig: jest.fn(),
}))

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockedConfig = {
  apis: {
    tokenVerification: {
      url: 'http://localhost:8100',
      enabled: true,
      timeout: 1000,
    },
  },
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

describe('token verification api tests', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    // config.apis.tokenVerification.url = 'http://localhost:8100'
    fakeApi = nock(mockedConfig.apis.tokenVerification.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('POST requests', () => {
    describe('Token verification disabled', () => {
      beforeAll(() => {
        mockedGetConfig.mockReturnValueOnce({
          ...mockedConfig,
          apis: { ...mockedConfig.apis, tokenVerification: { ...mockedConfig.apis.tokenVerification, enabled: false } },
        })
      })

      it('Token always considered valid', async () => {
        fakeApi.post('/token/verify', '').reply(200, { active: true })
        const data = await verifyToken({} as Request)
        expect(data).toEqual(true)
        expect(nock.isDone()).toBe(false) // assert api was not called
      })
    })

    describe('Token Verification enabled', () => {
      beforeEach(() => {
        mockedGetConfig.mockReturnValueOnce({
          ...mockedConfig,
          apis: { ...mockedConfig.apis, tokenVerification: { ...mockedConfig.apis.tokenVerification, enabled: true } },
        })
      })
      it('Calls verify and parses response', async () => {
        fakeApi.post('/token/verify', '').reply(200, { active: true })
        const data = await verifyToken({ user: {}, verified: false } as Request)
        expect(data).toEqual(true)
        expect(nock.isDone()).toBe(true) // assert api was called
      })

      it('Calls verify and parses inactive response', async () => {
        fakeApi.post('/token/verify', '').reply(200, { active: false })
        const data = await verifyToken({ user: {}, verified: false } as Request)
        expect(data).toEqual(false)
      })

      it('Calls verify and parses no response', async () => {
        fakeApi.post('/token/verify', '').reply(200, {})
        const data = await verifyToken({ user: {}, verified: false } as Request)
        expect(data).toEqual(false)
      })

      it('Already verified', async () => {
        fakeApi.post('/token/verify', '').reply(200, {})
        const data = await verifyToken({ verified: true } as Request)
        expect(data).toEqual(true)
        expect(nock.isDone()).toBe(false) // assert api was not called
      })

      it('Superagent throws error', async () => {
        fakeApi.post('/token/verify', '').reply(500, { active: true })
        await verifyToken({ user: {}, verified: false } as Request)
        expect(logger.error).toHaveBeenCalled()
      })
    })
  })
})
