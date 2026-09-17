import { DateTime } from 'luxon'
import { Controller } from '../@types'
import config from '../config'
import DeliusClient, { AppointmentSummary, Homepage } from '../data/deliusClient'
import MasApiClient from '../data/masApiClient'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { EnforcementContact } from '../data/model/schedule'

const routes = ['getHome', 'getHomeOld'] as const

const homeController: Controller<typeof routes, void> = {
  getHome: hmppsAuthClient => {
    return async function getHome(req, res) {
      if (!res.locals.flags?.enableDeliusClient) return homeController.getHomeOld(hmppsAuthClient)(req, res)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const deliusClient = new DeliusClient(token)
      let appointmentsRequiringOutcome
      let appointmentsRequiringOutcomeCount
      const homePage: Homepage = await deliusClient.getHomepage(res.locals.user.username)
      appointmentsRequiringOutcome = homePage.appointmentsRequiringOutcome
      appointmentsRequiringOutcomeCount = homePage.appointmentsRequiringOutcomeCount

      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      const masClient = new MasApiClient(token)

      let enforcementActions: EnforcementContact[] = []
      const enforcementContactResponse = await masClient.getEnforcementContacts(
        res.locals.user.username,
        (pageNum - 1).toString(),
      )
      enforcementActions = enforcementContactResponse.enforcementContacts

      const { upcomingAppointments } = homePage
      let lastThreeMonthsAppointmentsRequiringOutcome: AppointmentSummary[] = appointmentsRequiringOutcome
      if (res.locals.flags.enableHomePageOutcomesWithFilter) {
        lastThreeMonthsAppointmentsRequiringOutcome = appointmentsRequiringOutcome?.filter(contact => {
          const contactDate = DateTime.fromISO(contact.startDateTime)
          const threeMonthsAgo = DateTime.now().minus({ months: 3 })
          return contactDate >= threeMonthsAgo
        })
        appointmentsRequiringOutcome = lastThreeMonthsAppointmentsRequiringOutcome
        appointmentsRequiringOutcomeCount = lastThreeMonthsAppointmentsRequiringOutcome.length
      }
      const url = encodeURIComponent(req.url)
      await sendAuditMessage(res, 'VIEW_MAS_HOME', res.locals.user.username, SubjectType.USER)
      return res.render('pages/homepage/homepage', {
        upcomingAppointments,
        appointmentsRequiringOutcome,
        appointmentsRequiringOutcomeCount,
        enforcementActions,
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

  getHomeOld: hmppsAuthClient => {
    return async function getHomeOld(req, res) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const { appointments, outcomes, totalAppointments, totalOutcomes } = await masClient.getUserAppointments(
        res.locals.user.username,
      )

      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      let enforcementActions: EnforcementContact[] = []
      const enforcementContactResponse = await masClient.getEnforcementContacts(
        res.locals.user.username,
        (pageNum - 1).toString(),
      )
      enforcementActions = enforcementContactResponse.enforcementContacts
      let appointmentsRequiringOutcome = outcomes
      if (res.locals.flags.enableHomePageOutcomesWithFilter) {
        const lastThreeMonthsAppointmentsRequiringOutcome = appointmentsRequiringOutcome?.filter(contact => {
          const contactDate = DateTime.fromISO(contact.startDateTime)
          const threeMonthsAgo = DateTime.now().minus({ months: 3 })
          return contactDate >= threeMonthsAgo
        })
        appointmentsRequiringOutcome = lastThreeMonthsAppointmentsRequiringOutcome
      }
      const url = encodeURIComponent(req.url)
      return res.render('pages/homepage-old/homepage', {
        totalAppointments,
        totalOutcomes: appointmentsRequiringOutcome.length,
        appointments,
        outcomes: appointmentsRequiringOutcome,
        enforcementActions,
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
