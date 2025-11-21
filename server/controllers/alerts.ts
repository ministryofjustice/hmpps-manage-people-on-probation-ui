import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import { UserAlerts, UserAlertsContent } from '../models/Alerts'

const routes = ['getAlerts', 'clearSelectedAlerts'] as const

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res, next) => {
      const { user } = res.locals
      const { page = '0', sortBy, sortOrder } = req.query as Record<string, string>
      let { url } = req
      url = encodeURIComponent(url)
      const pageNumber = parseInt(page, 10)

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      const alertsData: UserAlerts = await masClient.getUserAlerts(pageNumber, sortBy, sortOrder as 'asc' | 'desc')

      let sortQueryString = ''
      if (sortBy) {
        sortQueryString += `&sortBy=${sortBy}`
      }
      if (sortOrder) {
        sortQueryString += `&sortOrder=${sortOrder}`
      }

      res.render('pages/alerts', {
        url,
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
        res.status(400).json({ error: 'No alerts selected' })
        return
      }

      const alertIds = Array.isArray(selectedAlerts)
        ? selectedAlerts.map((id: string) => parseInt(id, 10))
        : [parseInt(selectedAlerts, 10)]

      const token = await hmppsAuthClient.getSystemClientToken(user.username)
      const masClient = new MasApiClient(token)

      const response = await masClient.clearAlerts(alertIds)

      res.json({
        success: true,
        message: `${response.clearedCount} alert(s) cleared successfully`,
      })
    }
  },
}

export default alertsController
