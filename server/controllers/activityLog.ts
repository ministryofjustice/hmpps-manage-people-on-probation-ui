import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import type { Controller } from '../@types'
import { groupActivitiesByDate } from '../utils'
import MasApiClient from '../data/masApiClient'
import { getPersonActivity } from '../middleware'
import { ACTIVITY_LOG_PAGE_SIZE } from '../properties'

const routes = ['getOrPostActivityLog', 'getActivity', 'redirectToActivityLog'] as const

export const getQueryString = (params: Record<string, string>): string[] => {
  const queryParams: string[] = []
  const usedParams = ['view', 'keywords', 'dateFrom', 'dateTo', 'compliance', 'page', 'category', 'hideContact']
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
  redirectToActivityLog: _ => {
    return async (req, res) => {
      const { keywords = '', compliance = {} } = req.query
      const { crn } = req.params as Record<string, string>

      req.session.activityLogFilters = {
        keywords,
        compliance,
        crn,
      }

      return res.redirect(`/case/${crn}/activity-log`)
    }
  },

  getOrPostActivityLog: hmppsAuthClient => {
    return async (req, res) => {
      const { params } = req
      const { crn } = params as Record<string, string>

      if (req.query?.showSuccessBanner) {
        req.flash('contactCreated', req.query?.uploadFailed ? 'uploadFailed' : 'success')
        const cleanParams = new URLSearchParams(req.query as Record<string, string>)
        cleanParams.delete('showSuccessBanner')
        cleanParams.delete('uploadFailed')
        const cleanQuery = cleanParams.toString()
        return res.redirect(cleanQuery ? `${req.path}?${cleanQuery}` : req.path)
      }

      const { query, body } = req
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
      const currentPage = parseInt(page as string, 10)
      const pageSize = ACTIVITY_LOG_PAGE_SIZE
      const resultsStart = currentPage > 0 ? pageSize * currentPage + 1 : 1
      let resultsEnd = currentPage > 0 ? (currentPage + 1) * pageSize : pageSize
      if (personActivity?.totalResults >= resultsStart && personActivity?.totalResults <= resultsEnd) {
        resultsEnd = personActivity.totalResults
      }

      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ACTIVITY_LOG',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const baseUrl = req.url.split('?')[0]
      return res.render('pages/contact-log', {
        personActivity,
        crn,
        query: req.session.activityLogFilters,
        queryParams,
        page,
        view: currentView,
        tierCalculation,
        url: encodeURIComponent(req.url),
        baseUrl,
        resultsStart,
        resultsEnd,
        errorMessages: req.session.errorMessages,
        groupedActivities: groupActivitiesByDate(personActivity.activities),
      })
    }
  },
  getActivity: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      const { back } = req.query
      if (req.query?.showSuccessBanner) {
        req.flash('contactUpdated', req.query?.uploadFailed === 'true' ? 'uploadFailed' : 'success')
        const cleanParams = new URLSearchParams(req.query as Record<string, string>)
        cleanParams.delete('showSuccessBanner')
        cleanParams.delete('uploadFailed')
        const cleanQuery = cleanParams.toString()
        return res.redirect(cleanQuery ? `${req.path}?${cleanQuery}` : req.path)
      }
      const contactUpdatedFlash = req.flash('contactUpdated')?.[0]
      const showSuccessBanner = !!contactUpdatedFlash
      const uploadFailed = contactUpdatedFlash === 'uploadFailed'

      let { url } = req
      url = encodeURIComponent(url)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const personAppointment = await masClient.getPersonAppointment(crn, id)
      if (personAppointment.appointment.isAppointment) {
        if (back) {
          return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage?back=${back}`)
        }
        return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
      }
      const isActivityLog = true
      const queryParams = getQueryString(req.query as Record<string, string>)
      await auditService.sendAuditMessage({
        action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      return res.render('pages/appointments/appointment', {
        queryParams,
        back,
        personAppointment,
        crn,
        id,
        url,
        isActivityLog,
        showSuccessBanner,
        uploadFailed,
      })
    }
  },
}

export default activityLogController
