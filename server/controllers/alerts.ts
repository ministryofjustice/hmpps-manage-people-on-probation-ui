import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts, UserAlertsContent } from '../models/Alerts'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget } from '../utils'

const routes = ['getAlerts', 'getAlertNote', 'clearSelectedAlerts'] as const

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res) => {
      const { user } = res.locals
      const { page = '0' } = req.query as Record<string, string>
      const url = encodeURIComponent(req.url)
      const unencodedUrl = req.url
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

      res.render('pages/alerts', {
        note: false,
        unencodedUrl,
        url,
        alertsData,
        crnToRiskWidgetMap,
        sortedBy,
      })
    }
  },

  getAlertNote: hmppsAuthClient => {
    return async (req, res) => {
      const { contactId, noteId } = req.params
      const { back } = req.query
      const sortedBy = req.query.sortBy ? (req.query.sortBy as string) : 'date_and_time.desc'
      const url = encodeURIComponent(req.url)
      const unencodedUrl = req.url

      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const arnsClient = new ArnsApiClient(token)
      const alertNote: UserAlertsContent = await masClient.getUserAlertNote(contactId, noteId)
      const alertsData = { content: [alertNote] }

      const enableRiskOnAlertsDashboard = res.locals.flags.enableRiskOnAlertsDashboard === true
      let crnToRiskWidgetMap = {}
      if (enableRiskOnAlertsDashboard) {
        const uniqueCrns = [alertNote.crn]
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

      res.render('pages/alerts', {
        note: true,
        unencodedUrl,
        url,
        back,
        alertsData,
        crnToRiskWidgetMap,
        sortedBy,
      })
    }
  },

  clearSelectedAlerts: hmppsAuthClient => {
    return async (req, res, next) => {
      const { user } = res.locals
      const { selectedAlerts } = req.body

      const { url } = req

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
