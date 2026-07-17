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
})
