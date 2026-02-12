import type { Request, Response, NextFunction } from 'express'

describe('setUpCsrf middleware', () => {
  const originalEnv = process.env.NODE_ENV
  const csrfUseSpy = jest.fn()

  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  describe('when NODE_ENV = test', () => {
    it('does NOT register csrfSynchronisedProtection middleware', async () => {
      process.env.NODE_ENV = 'test'
      jest.doMock('express', () => {
        const actual = jest.requireActual('express')
        return {
          ...actual,
          Router: jest.fn(() => ({
            use: csrfUseSpy,
          })),
        }
      })
      const csrfSyncMock = jest.fn()
      jest.doMock('csrf-sync', () => ({
        csrfSync: csrfSyncMock,
      }))
      const { default: setUpCsrf } = await import('./setUpCsrf')
      setUpCsrf()
      expect(csrfSyncMock).not.toHaveBeenCalled()
    })
  })

  describe('when NODE_ENV = production', () => {
    it('registers csrfSynchronisedProtection middleware', async () => {
      process.env.NODE_ENV = 'production'
      const csrfProtection = jest.fn()
      jest.doMock('express', () => {
        const actual = jest.requireActual('express')
        return {
          ...actual,
          Router: jest.fn(() => ({
            use: csrfUseSpy,
          })),
        }
      })
      jest.doMock('csrf-sync', () => ({
        csrfSync: jest.fn(() => ({
          csrfSynchronisedProtection: csrfProtection,
        })),
      }))
      const { default: setUpCsrf } = await import('./setUpCsrf')
      setUpCsrf()
      expect(csrfUseSpy).toHaveBeenCalledWith(csrfProtection)
    })

    it('sets res.locals.csrfToken when req.csrfToken exists', async () => {
      process.env.NODE_ENV = 'production'
      const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = []
      jest.doMock('express', () => {
        const actual = jest.requireActual('express')
        return {
          ...actual,
          Router: jest.fn(() => ({
            use: (mw: any) => middlewares.push(mw),
          })),
        }
      })
      jest.doMock('csrf-sync', () => ({
        csrfSync: jest.fn(() => ({
          csrfSynchronisedProtection: jest.fn(),
        })),
      }))
      const { default: setUpCsrf } = await import('./setUpCsrf')
      setUpCsrf()
      const localsMiddleware = middlewares[middlewares.length - 1]

      const req = {
        csrfToken: jest.fn(() => 'csrf-token-value'),
      } as unknown as Request

      const res = {
        locals: {},
      } as Response

      const next = jest.fn()

      localsMiddleware(req, res, next)

      expect(res.locals.csrfToken).toBe('csrf-token-value')
      expect(next).toHaveBeenCalled()
    })
  })
})
