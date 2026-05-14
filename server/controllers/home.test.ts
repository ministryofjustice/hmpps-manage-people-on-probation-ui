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
          enforcementActions: [],
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
        expect(masSpy).not.toHaveBeenCalled()
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
          enforcementActions: [],
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
        const getHomeOldSpy = jest.spyOn(controllers.home, 'getHomeOld').mockReturnValue(legacyHandler as any)

        await controllers.home.getHome(hmppsAuthClient)(req, resWithLegacyFlag)

        expect(getHomeOldSpy).toHaveBeenCalledWith(hmppsAuthClient)
        expect(legacyHandler).toHaveBeenCalledWith(req, resWithLegacyFlag)
        getHomeOldSpy.mockRestore()
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
        const boundaryAppointment = {
          id: 3,
          name: { surname: 'Boundary', forename: 'Person' },
          crn: 'X000004',
          type: 'Office appointment',
          startDateTime: DateTime.now().minus({ years: 2 }).plus({ minutes: 1 }).toISO() as string,
        }
        const oldAppointment = {
          id: 2,
          name: { surname: 'Old', forename: 'Person' },
          crn: 'X000003',
          type: 'Office appointment',
          startDateTime: DateTime.now().minus({ years: 2, days: 1 }).toISO() as string,
        }
        const homepageWithMixedOutcomeDates = {
          ...mockHomepage,
          appointmentsRequiringOutcome: [recentAppointment, boundaryAppointment, oldAppointment],
          appointmentsRequiringOutcomeCount: 3,
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
          appointmentsRequiringOutcome: [recentAppointment, boundaryAppointment],
          appointmentsRequiringOutcomeCount: 2,
          enforcementActions: [],
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

    describe('enforcement actions overview feature flag', () => {
      it('should pass enforcement actions when enableMyEnforcementActionsOverview is true', async () => {
        const resWithEnforcementFlag = mockAppResponse({
          flags: { enableDeliusClient: true, enableMyEnforcementActionsOverview: true },
        })
        const renderSpyWithEnforcement = jest.spyOn(resWithEnforcementFlag, 'render')
        jest.spyOn(DeliusClient.prototype, 'getHomepage').mockResolvedValue(mockHomepage)
        jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts').mockResolvedValue({
          enforcementContacts: mockHomepage.enforcementContacts,
        } as any)

        await controllers.home.getHome(hmppsAuthClient)(req, resWithEnforcementFlag)

        expect(renderSpyWithEnforcement).toHaveBeenCalledWith(
          'pages/homepage/homepage',
          expect.objectContaining({
            enforcementActions: mockHomepage.enforcementContacts,
          }),
        )
      })

      it('should handle pagination for enforcement actions', async () => {
        const resWithEnforcementFlag = mockAppResponse({
          flags: { enableDeliusClient: true, enableMyEnforcementActionsOverview: true },
        })
        const reqWithPage = httpMocks.createRequest({
          params: { crn },
          query: { page: '2' },
          url: `${url}?page=2`,
          host: 'manage-people-on-probation-dev.hmpps.service.justice.gov.uk',
        })
        const renderSpyWithEnforcement = jest.spyOn(resWithEnforcementFlag, 'render')
        jest.spyOn(DeliusClient.prototype, 'getHomepage').mockResolvedValue(mockHomepage)
        const masSpyPagination = jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts').mockResolvedValue({
          enforcementContacts: mockHomepage.enforcementContacts,
        } as any)

        await controllers.home.getHome(hmppsAuthClient)(reqWithPage, resWithEnforcementFlag)

        expect(masSpyPagination).toHaveBeenCalledWith(resWithEnforcementFlag.locals.user.username, '1')
        expect(renderSpyWithEnforcement).toHaveBeenCalledWith(
          'pages/homepage/homepage',
          expect.objectContaining({
            enforcementActions: mockHomepage.enforcementContacts,
          }),
        )
      })
    })

    describe('getHomeOld', () => {
      const mockAppointments = [{ id: '1', type: 'Appointment' }]
      const mockOutcomes = [{ id: '2', type: 'Outcome' }]
      const mockEnforcementContacts = [{ id: '3', appointmentType: 'Enforcement' }]

      beforeEach(() => {
        jest.spyOn(MasApiClient.prototype, 'getUserAppointments').mockResolvedValue({
          appointments: mockAppointments,
          outcomes: mockOutcomes,
          totalAppointments: 1,
          totalOutcomes: 1,
        } as any)
        jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts').mockResolvedValue({
          enforcementContacts: mockEnforcementContacts,
        } as any)
      })

      it('should render legacy home page with correct data', async () => {
        const resOld = mockAppResponse({ flags: { enableDeliusClient: false } })
        const renderSpyOld = jest.spyOn(resOld, 'render')

        await controllers.home.getHomeOld(hmppsAuthClient)(req, resOld)

        expect(renderSpyOld).toHaveBeenCalledWith(
          'pages/homepage-old/homepage',
          expect.objectContaining({
            appointments: mockAppointments,
            outcomes: mockOutcomes,
            totalAppointments: 1,
            totalOutcomes: 1,
            enforcementActions: [],
          }),
        )
      })

      it('should render legacy home page with enforcement actions when flag is enabled', async () => {
        const resOld = mockAppResponse({
          flags: { enableDeliusClient: false, enableMyEnforcementActionsOverview: true },
        })
        const renderSpyOld = jest.spyOn(resOld, 'render')

        await controllers.home.getHomeOld(hmppsAuthClient)(req, resOld)

        expect(renderSpyOld).toHaveBeenCalledWith(
          'pages/homepage-old/homepage',
          expect.objectContaining({
            enforcementActions: mockEnforcementContacts,
          }),
        )
      })

      it('should handle pagination in getHomeOld', async () => {
        const resOld = mockAppResponse({
          flags: { enableDeliusClient: false, enableMyEnforcementActionsOverview: true },
        })
        const reqWithPage = httpMocks.createRequest({
          query: { page: '3' },
          url: `${url}?page=3`,
          host: 'manage-people-on-probation-dev.hmpps.service.justice.gov.uk',
        })
        const masSpyOldPagination = jest.spyOn(MasApiClient.prototype, 'getEnforcementContacts')

        await controllers.home.getHomeOld(hmppsAuthClient)(reqWithPage, resOld)

        expect(masSpyOldPagination).toHaveBeenCalledWith(resOld.locals.user.username, '2')
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
