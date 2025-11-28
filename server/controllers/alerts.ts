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
      const { page = '0' } = req.query as Record<string, string>
      const url = encodeURIComponent(req.url)
      const pageNumber = parseInt(page, 10)

      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date_and_time.desc'
      const [sortName, sortDirection] = sortedBy.split('.')

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)

      const alertsData: UserAlerts = await masClient.getUserAlerts(
        pageNumber,
        sortName.toUpperCase(),
        sortDirection as 'asc' | 'desc',
      )
      const enableRiskOnAlertsDashboard = res.locals.flags.enableRiskOnAlertsDashboard === true

      let crnToRiskWidgetMap = {}
      let arnsUnavailableError: any = null

      if (enableRiskOnAlertsDashboard) {
        const uniqueCrns = [...new Set(alertsData.content.map(item => item.crn))].filter(Boolean)

        const riskPromises = uniqueCrns.map(async crn => {
          if (arnsUnavailableError) {
            return { crn, risksWidget: arnsUnavailableError }
          }

          const risks = await arnsClient.getRisks(crn)
          let risksWidget = null

          if (isErrorSummary(risks)) {
            if (risks.errors.length > 0 && risks.errors[0]?.text) {
              arnsUnavailableError = risks
              risksWidget = risks
            } else {
              risksWidget = toRoshWidget(risks)
            }
          } else {
            risksWidget = toRoshWidget(risks)
          }

          return { crn, risksWidget }
        })

        const results = await Promise.all(riskPromises)

        if (arnsUnavailableError) {
          crnToRiskWidgetMap = uniqueCrns.reduce<Record<string, any>>((acc, crn) => {
            acc[crn] = arnsUnavailableError
            return acc
          }, {})
        } else {
          crnToRiskWidgetMap = results.reduce<Record<string, any>>((acc, current) => {
            if (current.risksWidget) {
              acc[current.crn] = current.risksWidget
            }
            return acc
          }, {})
        }
      }
      let risksErrors: { text: string }[] = []

      if (arnsUnavailableError) {
        risksErrors = arnsUnavailableError.errors.map((errorItem: any) => ({
          text: errorItem.text,
        }))
      }


      res.render('pages/alerts', {
        url,
        alertsData,
        crnToRiskWidgetMap,
        sortedBy,
        risksErrors
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

function isErrorSummary(obj: any): obj is { errors: any[] } {
  return typeof obj === 'object' && obj !== null && 'errors' in obj && Array.isArray(obj.errors)
}

export default alertsController
