import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import type { Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import { toPredictors, toRoshWidget } from '../utils'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { getPersonActivity } from '../middleware'

const routes = ['getOrPostActivityLog'] as const

export const getQueryString = (params: Record<string, string>): string[] => {
  const queryParams: string[] = []
  const usedParams = ['view', 'keywords', 'dateFrom', 'dateTo', 'compliance', 'page']
  for (const usedParam of usedParams) {
    if (params?.[usedParam]) {
      if (!Array.isArray(params[usedParam])) {
        queryParams.push(`${usedParam}=${params[usedParam]}`)
      } else {
        params[usedParam].forEach(param => queryParams.push(`${usedParam}=${param}`))
      }
    }
  }
  return queryParams
}

const activityLogController: Controller<typeof routes, void> = {
  getOrPostActivityLog: hmppsAuthClient => {
    return async (req, res) => {
      const { query, body, params } = req
      const { crn } = params
      const { page = '0', view = '' } = query
      let currentView = view ?? req?.body?.view
      if (req?.query?.view === 'compact' || req?.body?.view === 'compact') {
        res.locals.compactView = true
        currentView = 'compact'
      } else {
        res.locals.defaultView = true
      }

      const [tierCalculation, personActivity] = await getPersonActivity(req, res, hmppsAuthClient)
      const queryParams = getQueryString(body)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const arnsClient = new ArnsApiClient(token)
      const currentPage = parseInt(page as string, 10)
      const resultsStart = currentPage > 0 ? 10 * currentPage + 1 : 1
      let resultsEnd = currentPage > 0 ? (currentPage + 1) * 10 : 10
      if (personActivity?.totalResults >= resultsStart && personActivity?.totalResults <= resultsEnd) {
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
        view: currentView,
        tierCalculation,
        risksWidget,
        predictorScores,
        url: encodeURIComponent(req.url),
        baseUrl,
        resultsStart,
        resultsEnd,
        errorMessages: req.session.errorMessages,
      })
    }
  },
}

export default activityLogController
