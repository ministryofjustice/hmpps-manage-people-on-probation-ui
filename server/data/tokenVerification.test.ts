import nock from 'nock'
import { logger } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import { Request } from 'express'
import verifyToken from './tokenVerification'
import config from '../config'

describe('token verification api tests', () => {
  let fakeApi: nock.Scope

  const loggerErrorSpy = jest.spyOn(logger, 'error')

  beforeEach(() => {
    config.apis.tokenVerification.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.tokenVerification.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('POST requests', () => {
    describe('Token verification disabled', () => {
      beforeAll(() => {
        config.apis.tokenVerification.enabled = false
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
        config.apis.tokenVerification.enabled = true
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
        expect(loggerErrorSpy).toHaveBeenCalled()
      })
    })
  })
})
