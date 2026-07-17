import express, { Router } from 'express'
import request from 'supertest'
import instrumentRouter from './instrumentRouter'

describe('instrumentRouter', () => {
  it('captures the full handler chain, including handlers from a separate router.all() registration for the same path', async () => {
    instrumentRouter()

    const router = Router()

    function mwAll1(req: express.Request, res: express.Response, next: express.NextFunction) {
      next()
    }
    function mwAll2(req: express.Request, res: express.Response, next: express.NextFunction) {
      next()
    }
    function mwGet1(req: express.Request, res: express.Response, next: express.NextFunction) {
      next()
    }
    function controller(req: express.Request, res: express.Response) {
      res.json({ handlerTrace: req.handlerTrace })
    }

    // Mirrors the real app's pattern of splitting registrations for the same
    // path across router.all() and router.get().
    router.all('/case/:crn/thing', mwAll1, mwAll2)
    router.get('/case/:crn/thing', mwGet1, controller)

    const app = express()
    app.use(router)

    const response = await request(app).get('/case/X123456/thing')

    // req.route.stack alone would only report ['mwGet1', 'controller'],
    // silently missing mwAll1/mwAll2 - this is exactly the bug being fixed.
    // Each entry is prefixed with the registration method, so it's clear
    // mwAll1/mwAll2 came from router.all() and mwGet1/controller from
    // router.get().
    expect(response.body.handlerTrace).toEqual(['all:mwAll1', 'all:mwAll2', 'get:mwGet1', 'get:controller'])
  })

  it('does not include the router instance itself in the handler chain', async () => {
    instrumentRouter()

    const router = Router()
    function controller(req: express.Request, res: express.Response) {
      res.json({ handlerTrace: req.handlerTrace })
    }
    router.get('/thing', controller)

    const app = express()
    app.use(router)

    const response = await request(app).get('/thing')

    expect(response.body.handlerTrace).toEqual(['get:controller'])
  })

  it('labels unnamed (factory-returned) handlers by position', async () => {
    instrumentRouter()

    const router = Router()
    const factory = () => (req: express.Request, res: express.Response) => {
      res.json({ handlerTrace: req.handlerTrace })
    }
    router.get('/thing', factory())

    const app = express()
    app.use(router)

    const response = await request(app).get('/thing')

    expect(response.body.handlerTrace).toEqual(['get:unnamed#1'])
  })

  it('still invokes 4-arity error-handling middleware on error, and records it in the trace', async () => {
    instrumentRouter()

    function throwingController(req: express.Request, res: express.Response) {
      throw new Error('boom')
    }
    // Express only treats a middleware function as an error handler if it is
    // declared with exactly 4 params: (err, req, res, next). Wrapping this
    // must preserve that arity, or Express silently stops invoking it.
    function errorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
      res.status(500).json({ handlerTrace: req.handlerTrace, message: err.message })
    }

    // Mirrors the real app's pattern: routes registered on a Router instance
    // mounted via app.use(router), with a top-level error handler registered
    // directly on app via app.use(errorHandler) (see app.ts). Note: app.get/
    // post/etc() called directly on `app` (not on a Router) are NOT covered
    // by this patch, since Express internally delegates those to a separate
    // Route class rather than Router.prototype - not an issue here as this
    // codebase always registers routes via Router() instances.
    const router = Router()
    router.get('/thing', throwingController)

    const app = express()
    app.use(router)
    app.use(errorHandler)

    const response = await request(app).get('/thing')

    expect(response.status).toBe(500)
    expect(response.body.message).toBe('boom')
    expect(response.body.handlerTrace).toEqual(['get:throwingController', 'use:errorHandler'])
  })
})
