import getPaginationLinks, { Pagination } from '@ministryofjustice/probation-search-frontend/utils/pagination'
import { addParameters } from '@ministryofjustice/probation-search-frontend/utils/url'
import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts } from '../models/Alerts'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget } from '../utils'
import { RiskSummary, RoshRiskWidgetDto } from '../data/model/risk'
import { ErrorSummaryItem } from '../data/model/common'
import logger from '../../logger'
import { apiErrors } from '../properties'

const routes = ['getAlerts', 'clearSelectedAlerts'] as const

interface RestClientError {
  status: number
  errors: ErrorSummaryItem[]
}

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res) => {
      const { user } = res.locals
      const url = encodeURIComponent(req.url)
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date_and_time.desc'
      const [sortName, sortDirection] = sortedBy.split('.')
      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const alertsData: UserAlerts = await masClient.getUserAlerts(
        pageNum - 1,
        sortName.toUpperCase(),
        sortDirection as 'asc' | 'desc',
      )
      const enableRiskOnAlertsDashboard = res.locals.flags.enableRiskOnAlertsDashboard === true
      let results: { crn: string; risksWidget: RoshRiskWidgetDto | string }[] = []
      let crnToRiskWidgetMap: { [crn: string]: RiskSummary | string } = {}
      let risksErrors: { text: string }[] = []

      const responseIsError = (response: RiskSummary): response is RestClientError => {
        return (response as RestClientError)?.errors !== undefined
      }

      if (enableRiskOnAlertsDashboard) {
        let allRiskResponses: RiskSummary[] = []
        let arnsUnavailableError: string = null
        const uniqueCrns = [...new Set(alertsData.content.map(item => item.crn))].filter(Boolean)
        try {
          allRiskResponses = await Promise.all(uniqueCrns.map(crn => arnsClient.getRisks(crn)))
          // promise.all will complete and resolve even if response of any request is a 500 error, so check for error
          const responseErrorIndex = allRiskResponses.findIndex(riskResponse => responseIsError(riskResponse))
          if (responseErrorIndex >= 0) arnsUnavailableError = allRiskResponses[responseErrorIndex].errors[0].text
        } catch (err: any) {
          logger.error(err.message)
          arnsUnavailableError = apiErrors.risks
        }
        // this results, risksErrors and crnToRiskWidgetMap variables below probably need refactoring but left in so correct values are passed to template
        if (allRiskResponses.length) {
          results = allRiskResponses.map((riskResponse, i) => ({
            crn: uniqueCrns[i],
            risksWidget: arnsUnavailableError ?? toRoshWidget(riskResponse),
          }))
          crnToRiskWidgetMap = results.reduce((acc, { crn, risksWidget }) => ({ ...acc, [crn]: risksWidget }), {})
        }
        if (arnsUnavailableError) {
          risksErrors = [{ text: arnsUnavailableError }]
        }
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
        sortedBy,
        risksErrors,
      })
    }
  },

  clearSelectedAlerts: hmppsAuthClient => {
    return async (req, res, next) => {
      const { user } = res.locals
      const { selectedAlerts } = req.body

      if (!selectedAlerts || selectedAlerts.length === 0) {
        res.locals.alertsCleared = { error: true, message: `Select an alert to clear it.` }
        return next()
      }

      // Convert to array of numbers
      const alertIds = Array.isArray(selectedAlerts)
        ? selectedAlerts.map((id: string) => parseInt(id, 10))
        : [parseInt(selectedAlerts, 10)]

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      await masClient.clearAlerts(alertIds)
      const alertCount = alertIds.length
      res.locals.alertsCleared = {
        error: false,
        message: `You've cleared ${alertCount} ${alertCount > 1 ? 'alerts' : 'alert'}.`,
      }

      return next()
    }
  },
}

export default alertsController
