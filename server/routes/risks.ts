import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function risksRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/risk', controllers.risk.getRisk(hmppsAuthClient))

  get('/case/:crn/risk/flag/:id', controllers.risk.getRiskFlag(hmppsAuthClient))

  get('/case/:crn/risk/removed-risk-flags', controllers.risk.getRemovedRiskFlags(hmppsAuthClient))
}
