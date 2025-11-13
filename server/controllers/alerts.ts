import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'

const routes = ['getAlerts'] as const

const alertsController: Controller<typeof routes, void> = {
  getAlerts: hmppsAuthClient => {
    return async (req, res) => {
      return res.render('pages/alerts', {})
    }
  },
}

export default alertsController
