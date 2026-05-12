import httpMocks from 'node-mocks-http'
import express from 'express'
import request from 'supertest'
import { DateTime } from 'luxon'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import DeliusClient from '../data/deliusClient'
import MasApiClient from '../data/masApiClient'
import homeRoutes from '../routes/home'
import config from '../config'
import { mockHomepage, mockAppResponse } from './mocks'
import { checkSendAuditMessage } from './testutils'
import { SubjectType } from '../middleware/sendAuditMessage'

jest.mock('uuid', () => ({
  v4: () => 'f1654ea3-0abb-46eb-860b-654a96edbe20',
}))
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('../data/deliusClient')
jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const url = 'manage-people-on-probation-dev.hmpps.service.justice.gov.uk'
const res = mockAppResponse({ flags: { enableDeliusClient: true } })
const renderSpy = jest.spyOn(res, 'render')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

describe('homeController', () => {
  describe('getHome', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      url,
      host: 'manage-people-on-probation-dev.hmpps.service.justice.gov.uk',
    })
    const originalEnv = process.env.NODE_ENV
    const {
      upcomingAppointments,
      appointmentsRequiringOutcome,
      appointmentsRequiringOutcomeCount,
      enforcementContacts,
    } = mockHomepage
    let spy: jest.SpyInstance
    let masSpy: jest.SpyInstance
    beforeEach(async () => {
      jest.resetAllMocks()
      jest.resetModules()
      spy = jest.spyOn(DeliusClient.prototype, 'getHomepage').mockImplementation(() => Promise.resolve(mockHomepage))
      masSpy = jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts').mockImplementation(() =>
        Promise.resolve({
          enforcementContacts: mockHomepage.enforcementContacts,
          size: 1,
          page: 0,
          totalResults: 1,
          totalPages: 1,
        }),
      )
      await controllers.home.getHome(hmppsAuthClient)(req, res)
    })
    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      jest.resetModules()
    })
    describe('development', () => {
      beforeEach(async () => {
        process.env.NODE_ENV = 'development'
        jest.resetModules()
      })

      it('should render the home page with the esupervision link', () => {
        checkSendAuditMessage(res, 'VIEW_MAS_HOME', res.locals.user.username, SubjectType.USER)
        expect(renderSpy).toHaveBeenCalledWith('pages/homepage/homepage', {
          upcomingAppointments,
          appointmentsRequiringOutcome,
          appointmentsRequiringOutcomeCount,
          enforcementActions: enforcementContacts,
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
      })
      it('should request the homepage data from the api', () => {
        expect(spy).toHaveBeenCalledWith(res.locals.user.username)
      })
    })
    describe('production', () => {
      const mockReq = httpMocks.createRequest({
        params: {
          crn,
        },
        url,
        host: 'manage-people-on-probation.hmpps.service.justice.gov.uk',
      })
      beforeEach(async () => {
        process.env.NODE_ENV = 'production'
        spy = jest.spyOn(DeliusClient.prototype, 'getHomepage').mockImplementation(() => Promise.resolve(mockHomepage))
      })
      it('should render the page with no esupervision link', async () => {
        masSpy = jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts').mockImplementation(() =>
          Promise.resolve({
            enforcementContacts: mockHomepage.enforcementContacts,
            size: 1,
            page: 0,
            totalResults: 1,
            totalPages: 1,
          }),
        )
        await controllers.home.getHome(hmppsAuthClient)(mockReq, res)

        expect(renderSpy).toHaveBeenCalledWith('pages/homepage/homepage', {
          upcomingAppointments,
          appointmentsRequiringOutcome,
          appointmentsRequiringOutcomeCount,
          enforcementActions: enforcementContacts,
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
      })
    })

    describe('feature flag disabled', () => {
      it('should use the legacy homepage controller when enableDeliusClient is false', async () => {
        const resWithLegacyFlag = mockAppResponse({ flags: { enableDeliusClient: false } })
        const legacyHandler = jest.fn().mockResolvedValue(undefined)
        const getHomeOldSpy = jest
          .spyOn(controllers.home, 'getHomeOld')
          .mockReturnValue(legacyHandler as ReturnType<typeof controllers.home.getHomeOld>)

        await controllers.home.getHome(hmppsAuthClient)(req, resWithLegacyFlag)

        expect(getHomeOldSpy).toHaveBeenCalledWith(hmppsAuthClient)
        expect(legacyHandler).toHaveBeenCalledWith(req, resWithLegacyFlag)
      })
    })

    describe('outcomes filter with feature flag enabled', () => {
      it('should filter appointments requiring outcomes to only include the last 2 years and update count', async () => {
        const recentAppointment = {
          id: 1,
          name: { surname: 'Recent', forename: 'Person' },
          crn: 'X000002',
          type: 'Office appointment',
          startDateTime: DateTime.now().minus({ years: 1 }).toISO() as string,
        }
        const oldAppointment = {
          id: 2,
          name: { surname: 'Old', forename: 'Person' },
          crn: 'X000003',
          type: 'Office appointment',
          startDateTime: DateTime.now().minus({ years: 3 }).toISO() as string,
        }
        const homepageWithMixedOutcomeDates = {
          ...mockHomepage,
          appointmentsRequiringOutcome: [recentAppointment, oldAppointment],
          appointmentsRequiringOutcomeCount: 2,
        }
        const resWithFilterFlag = mockAppResponse({
          flags: { enableDeliusClient: true, enableHomePageOutcomesWithFilter: true },
        })
        const renderSpyWithFilter = jest.spyOn(resWithFilterFlag, 'render')
        jest
          .spyOn(DeliusClient.prototype, 'getHomepage')
          .mockImplementation(() => Promise.resolve(homepageWithMixedOutcomeDates))

        await controllers.home.getHome(hmppsAuthClient)(req, resWithFilterFlag)

        expect(renderSpyWithFilter).toHaveBeenCalledWith('pages/homepage/homepage', {
          upcomingAppointments: mockHomepage.upcomingAppointments,
          appointmentsRequiringOutcome: [recentAppointment],
          appointmentsRequiringOutcomeCount: 1,
          enforcementActions: enforcementContacts,
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
      })
    })

    describe('GET /sentry-test-error', () => {
      it('should throw an error and return 500', async () => {
        const app = express()
        const router = express.Router()

        // minimal services mock
        const services = {
          hmppsAuthClient: {},
        } as any

        homeRoutes(router, services)
        app.use(router)

        // basic error handler so Express returns 500 instead of crashing
        app.use((err: any, _req: any, response: any, _next: any) => {
          response.status(500).json({ message: err.message })
        })

        const response = await request(app).get('/sentry-test-error')

        expect(response.status).toBe(500)
        expect(response.body.message).toBe('Sentry alert test (Express) - ignore')
      })
    })
  })
})
