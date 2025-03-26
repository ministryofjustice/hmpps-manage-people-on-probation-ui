import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import type { ActivityLogRequestBody, AppResponse, Controller } from '../@types'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors, toCamelCase, toIsoDate } from '../utils/utils'
import MasApiClient from '../data/masApiClient'
import { PersonActivity } from '../data/model/activityLog'
import TierApiClient, { TierCalculation } from '../data/tierApiClient'

const routes = ['getActivityLog', 'getActivityDetails'] as const

export const getQueryString = (params: Record<string, string>): string[] => {
  const queryParams: string[] = []
  const usedParams = ['view', 'requirement', 'keywords', 'dateFrom', 'dateTo', 'compliance', 'page']
  for (const usedParam of usedParams) {
    if (params[usedParam]) {
      if (!Array.isArray(params[usedParam])) {
        queryParams.push(`${usedParam}=${params[usedParam]}`)
      } else {
        params[usedParam].forEach(param => queryParams.push(`${usedParam}=${param}`))
      }
    }
  }
  return queryParams
}

const activityLogController: Controller<typeof routes> = {
  getActivityLog: hmppsAuthClient => {
    return async (req, res) => {
      const { query, params } = req
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
      const { filters } = res.locals
      const { keywords, dateFrom, dateTo, compliance } = filters
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const tierClient = new TierApiClient(token)
      let personActivity: PersonActivity | null = null
      let tierCalculation: TierCalculation | null = null
      const body: ActivityLogRequestBody = {
        keywords,
        dateFrom: dateFrom ? toIsoDate(dateFrom) : '',
        dateTo: dateTo ? toIsoDate(dateTo) : '',
        filters: compliance ? compliance.map(option => toCamelCase(option)) : [],
      }
      ;[personActivity, tierCalculation] = await Promise.all([
        masClient.postPersonActivityLog(crn, body, page as string),
        tierClient.getCalculationDetails(crn),
      ])
      const queryParams = getQueryString(req.query as Record<string, string>)
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
      return res.render('pages/activity-log', {
        personActivity,
        crn,
        query,
        queryParams,
        page,
        view,
        tierCalculation,
        risksWidget,
        predictorScores,
        url: req.url,
        resultsStart,
        resultsEnd,
      })
    }
  },
  getActivityDetails: hmppsAuthClient => {
    return async (req, res) => {
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
      const queryParams = getQueryString(req.query as Record<string, string>)
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
      return res.render('pages/appointments/appointment', {
        category,
        queryParams,
        personAppointment,
        crn,
        isActivityLog,
        tierCalculation,
        risksWidget,
        predictorScores,
      })
    }
  },
}

export default activityLogController
