import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts } from '../models/Alerts'

const routes = ['getAlerts', 'clearSelectedAlerts'] as const

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res) => {
      const { user } = res.locals
      const { page = '0', sortBy, sortOrder } = req.query as Record<string, string>
      const pageNumber = parseInt(page, 10)

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      const alertsData: UserAlerts = await masClient.getUserAlerts(pageNumber, sortBy, sortOrder as 'asc' | 'desc')

      // Build sort query string for pagination links
      let sortQueryString = ''
      if (sortBy) {
        sortQueryString += `&sortBy=${sortBy}`
      }
      if (sortOrder) {
        sortQueryString += `&sortOrder=${sortOrder}`
      }

      res.render('pages/alerts', {
        alertsData,
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
