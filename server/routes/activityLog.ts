import { type Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { type Services } from '../services'
import validate from '../middleware/validation/index'
import { filterActivityLog, getPersonActivity } from '../middleware'
import type { AppResponse, Route } from '../@types'
import controllers from '../controllers'
import { getQueryString } from '../controllers/activityLog'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors } from '../utils/utils'

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
