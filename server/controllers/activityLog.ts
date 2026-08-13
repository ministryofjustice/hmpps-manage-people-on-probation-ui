import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import type { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { getPersonActivity, overrideDeliusManagedFlag, groupActivitiesByDate } from '../middleware'
import { ACTIVITY_LOG_PAGE_SIZE } from '../properties'
import { checkIsUpdatableContact } from '../data/model/mpopUpdatableContacts'
import { mapPersonActivityWithApprovedContactDisplayNames } from '../utils/contactDisplayNames'

const routes = ['getOrPostActivityLog', 'getActivity', 'redirectToActivityLog'] as const

export const getQueryString = (params: qs.ParsedQs): string[] => {
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
  redirectToActivityLog: () => {
    return async function redirectToActivityLog(req, res) {
      const { keywords = '', compliance = [] } = req.query
      const { crn } = req.params as Record<string, string>
      req.session.activityLogFilters = {
        keywords,
        compliance: Array.isArray(compliance) ? compliance : [compliance],
        crn,
      }
      return res.redirect(`/case/${crn}/activity-log`)
    }
  },
  getOrPostActivityLog: hmppsAuthClient => {
    return async function getOrPostActivityLog(req, res) {
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

      const { query } = req
      const { view = '' } = query
      const page = query.submit ? '0' : (query.page ?? '0')
      let currentView = view
      if (req?.query?.view === 'compact') {
        res.locals.compactView = true
        currentView = 'compact'
      } else {
        res.locals.defaultView = true
      }

      const [tierCalculation, personActivityResponse] = await getPersonActivity(req, res, hmppsAuthClient)
      let personActivity = personActivityResponse
      const queryParams = getQueryString(query)
      const currentPage = parseInt(page as string, 10)
      const pageSize = ACTIVITY_LOG_PAGE_SIZE
      const resultsStart = currentPage > 0 ? pageSize * currentPage + 1 : 1
      let resultsEnd = currentPage > 0 ? (currentPage + 1) * pageSize : pageSize
      if (personActivity?.totalResults >= resultsStart && personActivity?.totalResults <= resultsEnd) {
        resultsEnd = personActivity.totalResults
      }
      personActivity = mapPersonActivityWithApprovedContactDisplayNames(personActivity)
      personActivity.activities = personActivity.activities.map(activity => ({
        ...activity,
        isUpdatableContact: checkIsUpdatableContact(activity.type),
      }))

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
        groupedActivities: groupActivitiesByDate(personActivity.activities)(req, res),
      })
    }
  },
  getActivity: hmppsAuthClient => {
    return async function getActivity(req, res) {
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
      const response = await masClient.getPersonAppointment(crn, id)
      const personAppointment = {
        ...response,
        appointment:
          res.locals.flags?.enablePreSentence === false
            ? overrideDeliusManagedFlag([response?.appointment])(req, res)[0]
            : response?.appointment,
      }

      const isUpdatableContact = checkIsUpdatableContact(personAppointment?.appointment?.type)

      if (isUpdatableContact) {
        personAppointment.appointment.isUpdatableContact = true
      } else {
        personAppointment.appointment.isUpdatableContact = false
      }
      if (personAppointment.appointment.isAppointment && !personAppointment.appointment.deliusManaged) {
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
