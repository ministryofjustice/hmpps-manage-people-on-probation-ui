import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { type Services } from '../services'
import { filterActivityLog } from '../middleware'
import type { Route } from '../@types'
import controllers from '../controllers'
import validate from '../middleware/validation/index'

export default function activityLogRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  router.all(
    '/case/:crn/activity-log',
    validate.activityLog,
    filterActivityLog,
    controllers.activityLog.getOrPostActivityLog(hmppsAuthClient),
  )

  router.get('/case/:crn/activity-log', [
    validate.activityLog,
    filterActivityLog,
    controllers.activityLog.getActivityLog(hmppsAuthClient),
  ])

  get('/case/:crn/activity-log/activity/:id', controllers.activityLog.getActivityDetails(hmppsAuthClient))

  get('/case/:crn/activity-log/activity/:id/note/:noteId', controllers.activityLog.getActivityNote(hmppsAuthClient))
}
