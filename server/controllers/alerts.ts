import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts, UserAlertsContent } from '../models/Alerts'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget } from '../utils'

const routes = ['getAlerts', 'clearSelectedAlerts'] as const

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res) => {
      const { user } = res.locals
      const { sortBy, sortOrder } = req.query as Record<string, string>
      const url = encodeURIComponent(req.url)
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)

      const alertsData: UserAlerts = await masClient.getUserAlerts(pageNum - 1, sortBy, sortOrder as 'asc' | 'desc')
      const enableRiskOnAlertsDashboard = res.locals.flags.enableRiskOnAlertsDashboard === true

      let crnToRiskWidgetMap = {}

      if (enableRiskOnAlertsDashboard) {
        const uniqueCrns = [...new Set(alertsData.content.map(item => item.crn))].filter(Boolean)
        const riskPromises = uniqueCrns.map(async crn => {
          const risks = await arnsClient.getRisks(crn)
          const risksWidget = toRoshWidget(risks)
          return { crn, risksWidget }
        })

        const results = await Promise.all(riskPromises)

        crnToRiskWidgetMap = results.reduce<Record<string, any>>((acc, current) => {
          if (current.risksWidget) {
            acc[current.crn] = current.risksWidget
          }
          return acc
        }, {})
      }

      let sortQueryString = ''
      if (sortBy) {
        sortQueryString += `&sortBy=${sortBy}`
      }
      if (sortOrder) {
        sortQueryString += `&sortOrder=${sortOrder}`
      }

      const pagination: Pagination = getPaginationLinks(
        req.query.page ? pageNum : 1,
        alertsData?.totalPages || 0,
        alertsData?.totalResults || 0,
        page => addParameters(req, { page: page.toString() }),
        alertsData?.size || 10,
      )

      res.render('pages/alerts', {
        url,
        alertsData,
        pagination,
        crnToRiskWidgetMap,
        sortQueryString,
        currentSort: {
          column: sortBy,
          order: sortOrder,
        },
      })
    }
  },

  clearSelectedAlerts: hmppsAuthClient => {
    return async (req, res, next) => {
      const { user } = res.locals
      const { selectedAlerts } = req.body

      if (!selectedAlerts || selectedAlerts.length === 0) {
        res.locals.alertsCleared = { error: true, message: `Select an alert to clear it` }
        return next()
      }

      // Convert to array of numbers
      const alertIds = Array.isArray(selectedAlerts)
        ? selectedAlerts.map((id: string) => parseInt(id, 10))
        : [parseInt(selectedAlerts, 10)]

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      await masClient.clearAlerts(alertIds)
      res.locals.alertsCleared = { error: false, message: `${alertIds.length} alert(s) cleared successfully` }

      return next()
    }
  },
}

export default alertsController
