import { Controller } from '../@types'
import config from '../config'
import DeliusClient from '../data/deliusClient'

const routes = ['getHome'] as const

const homeController: Controller<typeof routes, void> = {
  getHome: hmppsAuthClient => {
    return async (req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const deliusClient = new DeliusClient(token)
      const { upcomingAppointments, appointmentsRequiringOutcome, appointmentsRequiringOutcomeCount } =
        await deliusClient.getHomepage(res.locals.user.username)
      const url = encodeURIComponent(req.url)
      return res.render('pages/homepage/homepage', {
        upcomingAppointments,
        appointmentsRequiringOutcome,
        appointmentsRequiringOutcomeCount,
        url,
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
