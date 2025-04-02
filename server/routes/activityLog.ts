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
    async (req, res: AppResponse, _next) => {
      const { query, body, params } = req
      const { crn } = params
      const { page = '0', view = '' } = query

      if (req.query.view === 'compact') {
        res.locals.compactView = true
      } else {
        res.locals.defaultView = true
      }
      if (req.query.requirement) {
        res.locals.requirement = req.query.requirement as string
      }

      const [tierCalculation, personActivity] = await getPersonActivity(req, res, hmppsAuthClient)

      const queryParams = getQueryString(body)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const currentPage = parseInt(page as string, 10)
      const resultsStart = currentPage > 0 ? 10 * currentPage + 1 : 1
      let resultsEnd = currentPage > 0 ? (currentPage + 1) * 10 : 10
      if (personActivity.totalResults >= resultsStart && personActivity.totalResults <= resultsEnd) {
        resultsEnd = personActivity.totalResults
      }

      const [risks, predictors] = await Promise.all([arnsClient.getRisks(crn), arnsClient.getPredictorsAll(crn)])

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ACTIVITY_LOG',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })

      const risksWidget = toRoshWidget(risks)

      const predictorScores = toPredictors(predictors)
      const baseUrl = req.url.split('?')[0]

      res.render('pages/activity-log', {
        personActivity,
        crn,
        query: req.session.activityLogFilters,
        queryParams,
        page,
        view,
        tierCalculation,
        risksWidget,
        predictorScores,
        url: req.url,
        baseUrl,
        resultsStart,
        resultsEnd,
      })
    },
  )

  router.get('/case/:crn/activity-log', [
    validate.activityLog,
    filterActivityLog,
    controllers.activityLog.getActivityLog(hmppsAuthClient),
  ])

  get('/case/:crn/activity-log/activity/:id', controllers.activityLog.getActivityDetails(hmppsAuthClient))

  get('/case/:crn/activity-log/activity/:id/note/:noteId', controllers.activityLog.getActivityNote(hmppsAuthClient))
}
