import { DateTime } from 'luxon'
import { Controller } from '../@types'
import config from '../config'
import DeliusClient, { Homepage } from '../data/deliusClient'
import MasApiClient from '../data/masApiClient'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { EnforcementContact, EnforcementContactsResponse } from '../data/model/schedule'
import { UserAppontment } from '../data/model/caseload'

const homeController: Controller<readonly ['getHome', 'getHomeOld'], void> = {
  getHome: hmppsAuthClient => {
    return async function getHome(req, res) {
      if (!res.locals.flags?.enableDeliusClient) return homeController.getHomeOld(hmppsAuthClient)(req, res)
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const deliusClient = new DeliusClient(token)
      const homePage: Homepage = await deliusClient.getHomepage(res.locals.user.username)
      const { appointmentsRequiringOutcome } = homePage
      const { appointmentsRequiringOutcomeCount } = homePage

      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      const masClient = new MasApiClient(token)

      let enforcementActions: EnforcementContact[] = []
      const enforcementContactResponse: EnforcementContactsResponse = res.locals.flags?.disableEnforcementContacts
        ? { size: 0, page: 0, totalResults: 0, totalPages: 0, enforcementContacts: [], timeoutError: undefined }
        : await masClient.getEnforcementContacts(res.locals.user.username, (pageNum - 1).toString(), true)
      enforcementActions = enforcementContactResponse.enforcementContacts

      const { upcomingAppointments } = homePage
      const url = encodeURIComponent(req.url)
      await sendAuditMessage(res, 'VIEW_MAS_HOME', res.locals.user.username, SubjectType.USER)
      return res.render('pages/homepage/homepage', {
        upcomingAppointments: upcomingAppointments ?? [],
        appointmentsRequiringOutcome: appointmentsRequiringOutcome ?? [],
        appointmentsRequiringOutcomeCount,
        enforcementActions: enforcementActions ?? [],
        url,
        appointmentsTimeoutError: homePage.timeoutError,
        enforcementTimeoutError: enforcementContactResponse.timeoutError,
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
      let homepage: UserAppontment
      if (!res.locals.flags?.disableUserAppointments) {
        const today = DateTime.now().setZone('Europe/London').startOf('day')
        const fromDate = res.locals.flags?.enable3MonthsOutcomes
          ? today.minus({ months: 3 })
          : today.minus({ years: 2 })
        homepage = res.locals.flags?.enableHomePageV2API
          ? await masClient.getUserAppointmentsV2(
              res.locals.user.username,
              fromDate.toFormat('yyyy-MM-dd') as unknown as string,
            )
          : await masClient.getUserAppointments(res.locals.user.username)
      } else {
        homepage = { appointments: [], outcomes: [], totalAppointments: 0, totalOutcomes: 0, timeoutError: undefined }
      }
      const {
        appointments,
        outcomes,
        totalAppointments,
        totalOutcomes,
        timeoutError: appointmentsTimeoutError,
      } = homepage
      const pageNum: number = req.query.page ? Number.parseInt(req.query.page as string, 10) : 1

      let enforcementActions: EnforcementContact[] = []
      const enforcementContactResponse: EnforcementContactsResponse = res.locals.flags?.disableEnforcementContacts
        ? { size: 0, page: 0, totalResults: 0, totalPages: 0, enforcementContacts: [], timeoutError: undefined }
        : await masClient.getEnforcementContacts(res.locals.user.username, (pageNum - 1).toString(), true)
      enforcementActions = enforcementContactResponse.enforcementContacts
      const appointmentsRequiringOutcome = outcomes
      const url = encodeURIComponent(req.url)
      return res.render('pages/homepage-old/homepage', {
        totalAppointments,
        totalOutcomes,
        appointments: appointments ?? [],
        outcomes: appointmentsRequiringOutcome ?? [],
        enforcementActions: enforcementActions ?? [],
        enforcementTimeoutError: enforcementContactResponse.timeoutError,
        appointmentsTimeoutError,
        disableUserAppointments: res.locals.flags?.disableUserAppointments,
        disableEnforcementContacts: res.locals.flags?.disableEnforcementContacts,
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
