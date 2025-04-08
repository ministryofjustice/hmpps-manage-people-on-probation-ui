/* eslint-disable import/no-extraneous-dependencies */

import { type Router } from 'express'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 } from 'uuid'
import { Query } from 'express-serve-static-core'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { type Services } from '../services'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import validate from '../middleware/validation/index'
import { filterActivityLog } from '../middleware'
import type { AppResponse, Route } from '../@types'
import { getPersonActivity } from '../middleware/getPersonActivity'
import { toPredictors, toRoshWidget } from '../utils'
import ArnsApiClient from '../data/arnsApiClient'

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

  get('/case/:crn/activity-log/activity/:id', async (req, res, _next) => {
    const { crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)

    const arnsClient = new ArnsApiClient(token)
    const masClient = new MasApiClient(token)
    const tierClient = new TierApiClient(token)
    const [personAppointment, tierCalculation, risks, predictors] = await Promise.all([
      masClient.getPersonAppointment(crn, id),
      tierClient.getCalculationDetails(crn),
      arnsClient.getRisks(crn),
      arnsClient.getPredictorsAll(crn),
    ])
    const isActivityLog = true
    const queryParams = getQueryString(req.query)
    const { category } = req.query

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    const risksWidget = toRoshWidget(risks)

    const predictorScores = toPredictors(predictors)
    res.render('pages/appointments/appointment', {
      category,
      queryParams,
      personAppointment,
      crn,
      isActivityLog,
      tierCalculation,
      risksWidget,
      predictorScores,
    })
  })

  get('/case/:crn/activity-log/activity/:id/note/:noteId', async (req, res, _next) => {
    const { crn, id, noteId } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const personAppointment = await masClient.getPersonAppointmentNote(crn, id, noteId)
    const isActivityLog = true
    const queryParams = getQueryString(req.query)
    const { category } = req.query

    await auditService.sendAuditMessage({
      action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: v4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })

    res.render('pages/appointments/appointment', {
      category,
      queryParams,
      personAppointment,
      crn,
      isActivityLog,
    })
  })

  function getQueryString(params: Query): string[] {
    const queryParams: string[] = []
    const usedParams = ['view', 'requirement', 'keywords', 'dateFrom', 'dateTo', 'compliance', 'page']
    for (const usedParam of usedParams) {
      if (params[usedParam]) {
        if (!Array.isArray(params[usedParam])) {
          queryParams.push(`${usedParam}=${params[usedParam] as string}`)
        } else {
          params[usedParam].forEach(param => queryParams.push(`${usedParam}=${param as string}`))
        }
      }
    }

    return queryParams
  }
}
