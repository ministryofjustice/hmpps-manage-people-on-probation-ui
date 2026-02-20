import type { Request, Response } from 'express'
import { getFrontendComponents } from './probationFEComponentsMiddleware'

const mockedLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any

describe('ProbationFEComponentsMiddleware', () => {
  let next: jest.Mock

  beforeEach(() => {
    next = jest.fn()
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  function createReqRes(options?: { session?: any; token?: string }): { req: Request; res: Response } {
    const req = {
      session: options?.session ?? {},
    } as unknown as Request

    const res = {
      locals: {
        user: options?.token !== undefined ? { token: options.token } : undefined,
      },
    } as unknown as Response

    return { req, res }
  }

  it('uses cached components from session when available and calls next', async () => {
    const cached = {
      header: '<header>cached</header>',
      footer: '<footer>cached</footer>',
      cssIncludes: ['a.css'],
      jsIncludes: ['a.js'],
    }
    const { req, res } = createReqRes({ session: { feComponents: cached } })

    const fakeService = { getProbationFEComponents: jest.fn() }

    const mw = getFrontendComponents(fakeService as any)
    await mw(req, res, next)

    expect(res.locals.feComponents).toBe(cached)
    expect(fakeService.getProbationFEComponents).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('skips fetching when no token is present and calls next', async () => {
    const { req, res } = createReqRes({ token: undefined })

    const fakeService = { getProbationFEComponents: jest.fn() }

    const mw = getFrontendComponents(fakeService as any)
    await mw(req, res, next)

    expect(fakeService.getProbationFEComponents).not.toHaveBeenCalled()
    expect(res.locals.feComponents).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('fetches components, applies transform, populates res.locals and caches session', async () => {
    const token = 'user-token'
    const { req, res } = createReqRes({ token })

    const headerHtml = '<a href="#">Home</a>'
    const footerHtml = '<footer>ok</footer>'

    const fakeService = {
      getProbationFEComponents: jest.fn().mockResolvedValue({
        header: { html: headerHtml, css: ['h.css'], javascript: ['h.js'] },
        footer: { html: footerHtml, css: ['f.css'], javascript: ['f.js'] },
      }),
    }

    const mw = getFrontendComponents(fakeService as any)
    await mw(req, res, next)

    // replaceHashWithSlash should convert href="#" to href="/"
    expect(res.locals.feComponents).toEqual({
      header: '<a href="/">Home</a>',
      footer: footerHtml,
      cssIncludes: ['h.css', 'f.css'],
      jsIncludes: ['h.js', 'f.js'],
    })

    // Cached into the session

    expect((req.session as any).feComponents).toEqual(res.locals.feComponents)

    expect(fakeService.getProbationFEComponents).toHaveBeenCalledWith(['header', 'footer'], token)
    expect(next).toHaveBeenCalled()
  })

  it('logs and continues when service throws an error', async () => {
    const token = 'user-token'
    const { req, res } = createReqRes({ token })

    const fakeService = {
      getProbationFEComponents: jest.fn().mockRejectedValue(new Error('network')),
    }

    const mw = getFrontendComponents(fakeService as any)
    await mw(req, res, next)

    // Should log and still call next without throwing
    expect(mockedLogger.info).toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
