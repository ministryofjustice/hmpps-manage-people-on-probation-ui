import express, { NextFunction, Request, Response } from 'express'
import request from 'supertest'
import nunjucksSetup from './nunjucksSetup'
import type { Services } from '../services'
import { ApplicationInfo } from '../applicationInfo'

const mockTechnicalUpdatesService = {
  getLatestTechnicalUpdateHeading: jest.fn(() => 'Mock Technical Update Heading'),
  getTechnicalUpdates: jest.fn(),
}

const mockSearchService = {
  post: jest.fn((req, res, next) => next()),
  get: jest.fn((req, res, next) => next()),
}

const mockServices: Services = {
  technicalUpdatesService: mockTechnicalUpdatesService,
  searchService: mockSearchService,
} as unknown as Services

const appInfo: ApplicationInfo = {
  applicationName: '',
  version: '',
  buildNumber: '',
  gitRef: '',
  gitShortHash: '#gitShortHash',
  productId: '',
  branchName: '',
}

const deferred = () => {
  let resolve!: () => void
  let reject!: (error: unknown) => void

  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

/**
 * Regression test for request-scoped Nunjucks filter state.
 *
 * `decorateFormAttributes` depends on request-specific data from
 * `req.session.data`, `req.body` and `res.locals.errorMessages`.
 *
 * The previous implementation registered the filter on every request:
 *
 *   njkEnv.addFilter('decorateFormAttributes', decorateFormAttributes(req, res))
 *
 * Because `njkEnv` is shared by the whole Express app, overlapping requests
 * could overwrite the global filter with a closure bound to a different
 * request's `req`/`res`.
 *
 * This test creates two overlapping requests:
 *
 * - request A reaches the route first, then pauses
 * - request B reaches the route and continues
 * - request A then renders after B has had a chance to replace the filter
 *
 * With the old implementation, request A can render using request B's form
 * state. With the request-scoped fix, each request renders its own value.
 */
it('keeps decorateFormAttributes request-scoped under overlapping requests', async () => {
  const app = express()

  nunjucksSetup(app, appInfo, mockServices)

  const aAtRoute = deferred()
  const bAtRoute = deferred()

  app.get('/race', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = String(req.query.value)
      const reqId = String(req.query.reqId)

      // Fake the session data that decorateFormAttributes reads.
      // Each request gets a different date so we can detect leaked context.
      ;(req as any).session = {
        data: {
          appointments: {
            CRN1: {
              ID1: {
                date: value,
              },
            },
          },
        },
      }
      ;(req as any).body = {}

      // Force an overlap:
      // A starts first and waits.
      // B starts second and reaches the render path.
      // This reproduces the old bug where B could overwrite the shared Nunjucks filter
      // before A rendered its template.
      if (reqId === 'A') {
        aAtRoute.resolve()
        await bAtRoute.promise
      } else {
        bAtRoute.resolve()
      }

      const njkEnv = req.app.get('nunjucksEnv')

      const html = njkEnv.renderString(
        `
          {% set cfg = { value: '' } | decorateFormAttributes(['appointments', 'CRN1', 'ID1', 'date']) %}
          {{ cfg.value }}
        `,
        {},
      )

      res.status(200).send(html.trim())
    } catch (error) {
      next(error)
    }
  })

  const reqAPromise = request(app)
    .get('/race')
    .query({ reqId: 'A', value: '2026-06-04' })
    .then(response => response)

  await aAtRoute.promise

  const reqBPromise = request(app)
    .get('/race')
    .query({ reqId: 'B', value: '2030-01-01' })
    .then(response => response)

  const [resA, resB] = await Promise.all([reqAPromise, reqBPromise])

  expect(resA.status).toBe(200)
  expect(resB.status).toBe(200)

  expect(resA.text).toContain('4/6/2026')
  expect(resA.text).not.toContain('1/1/2030')

  expect(resB.text).toContain('1/1/2030')
  expect(resB.text).not.toContain('4/6/2026')
})

it('does not use another overlapping request when that request has no session', async () => {
  const app = express()

  nunjucksSetup(app, appInfo, mockServices)

  const aAtRoute = deferred()
  const bAtRoute = deferred()

  app.get('/race-missing-session', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqId = String(req.query.reqId)

      if (reqId === 'A') {
        // Request A has valid session data and should render successfully.
        ;(req as any).session = {
          data: {
            appointments: {
              CRN1: {
                ID1: {
                  date: '2026-06-04',
                },
              },
            },
          },
        }
      } else {
        // Request B deliberately has no session.
        // With the old global-filter implementation, B can overwrite the
        // shared filter before A renders. A may then execute the filter using
        // B's req/res and hit:
        //
        // TypeError: Cannot destructure property 'data' of 'req.session'
        // as it is undefined.
        ;(req as any).session = undefined
      }

      ;(req as any).body = {}

      // Force overlap:
      // A enters first and waits. B then enters and has a chance to register
      // the global Nunjucks filter with a request that has no session.
      if (reqId === 'A') {
        aAtRoute.resolve()
        await bAtRoute.promise
      } else {
        bAtRoute.resolve()
      }

      const njkEnv = req.app.get('nunjucksEnv')

      const html = njkEnv.renderString(
        `
          {% set cfg = { value: '' } | decorateFormAttributes(['appointments', 'CRN1', 'ID1', 'date']) %}
          {{ cfg.value }}
        `,
        {},
      )

      res.status(200).send(html.trim())
    } catch (error) {
      next(error)
    }
  })

  const reqAPromise = request(app)
    .get('/race-missing-session')
    .query({ reqId: 'A' })
    .then(response => response)

  await aAtRoute.promise

  const reqBPromise = request(app)
    .get('/race-missing-session')
    .query({ reqId: 'B' })
    .then(response => response)

  const [resA] = await Promise.all([reqAPromise, reqBPromise])

  // With the fixed implementation, A keeps its own request context and succeeds.
  expect(resA.status).toBe(200)
  expect(resA.text).toContain('4/6/2026')
})
