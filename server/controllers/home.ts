import { Controller } from '../@types'
import MasApiClient from '../data/masApiClient'
import config from '../config'

const routes = ['getHome'] as const

const homeController: Controller<typeof routes> = {
  getHome: hmppsAuthClient => {
    return async (_req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { appointments, outcomes, totalAppointments, totalOutcomes } = await masClient.getUserAppointments(
        res.locals.user.username,
      )
      return res.render('pages/homepage/homepage', {
        totalAppointments,
        totalOutcomes,
        appointments,
        outcomes,
        delius_link: config.delius.link,
        oasys_link: config.oaSys.link,
        interventions_link: config.interventions.link,
        recall_link: config.recall.link,
        cas1_link: config.cas1.link,
        cas3_link: config.cas3.link,
        caval_link: config.caval.link,
        epf2_link: config.epf2.link,
      })
    }
  },
}

export default homeController
