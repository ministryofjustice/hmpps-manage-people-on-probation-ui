import { DateTime } from 'luxon'
import { Controller } from '../@types'
import config from '../config'
import DeliusClient, { AppointmentSummary, Homepage } from '../data/deliusClient'
import MasApiClient from '../data/masApiClient'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = ['getHome', 'getHomeOld'] as const

const homeController: Controller<typeof routes, void> = {
  getHome: hmppsAuthClient => {
    return async (req, res) => {
      if (!res.locals.flags?.enableDeliusClient) return homeController.getHomeOld(hmppsAuthClient)(req, res)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const deliusClient = new DeliusClient(token)
      let appointmentsRequiringOutcome
      let appointmentsRequiringOutcomeCount
      const homePage: Homepage = await deliusClient.getHomepage(res.locals.user.username)
      appointmentsRequiringOutcome = homePage.appointmentsRequiringOutcome
      appointmentsRequiringOutcomeCount = homePage.appointmentsRequiringOutcomeCount
      const { upcomingAppointments } = homePage
      let lastTwoYearsAppointmentsRequiringOutcome: AppointmentSummary[] = appointmentsRequiringOutcome
      if (res.locals.flags.enableHomePageOutcomesWithFilter) {
        lastTwoYearsAppointmentsRequiringOutcome = appointmentsRequiringOutcome?.filter(contact => {
          const contactDate = DateTime.fromISO(contact.startDateTime)
          const twoYearsAgo = DateTime.now().minus({ years: 2 })
          return contactDate >= twoYearsAgo
        })
        appointmentsRequiringOutcome = lastTwoYearsAppointmentsRequiringOutcome
        appointmentsRequiringOutcomeCount = lastTwoYearsAppointmentsRequiringOutcome.length
      }
      const url = encodeURIComponent(req.url)
      await sendAuditMessage(res, 'VIEW_MAS_HOME', res.locals.user.username, SubjectType.USER)
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

  /**
   * @deprecated use getHome
   */
  getHomeOld: hmppsAuthClient => {
    return async (req, res) => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { appointments, outcomes, totalAppointments, totalOutcomes } = await masClient.getUserAppointments(
        res.locals.user.username,
      )
      const isDev = ['manage-people-on-probation-dev.hmpps.service.justice.gov.uk', 'localhost'].some(host =>
        req.host.includes(host),
      )
      const url = encodeURIComponent(req.url)
      return res.render('pages/homepage-old/homepage', {
        totalAppointments,
        totalOutcomes,
        appointments,
        outcomes,
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
