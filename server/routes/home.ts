import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'

export default function caseloadRoutes(router: Router) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/', async (_req, res, _next) => {
    res.render('pages/homepage/homepage', {})
  })
}
