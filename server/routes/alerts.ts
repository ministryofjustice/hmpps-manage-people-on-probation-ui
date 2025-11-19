import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function alertsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string | string[], handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get('/alerts', controllers.alerts.getAlerts(hmppsAuthClient))
  post('/alerts/clear', controllers.alerts.clearSelectedAlerts(hmppsAuthClient))

  get('/alerts/:alertId/notes/:noteId', controllers.alerts.getAlertsNote(hmppsAuthClient))
}
