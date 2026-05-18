import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import { mockTierCalculation, mockActivities, mockAppResponse, mockPersonAppointment } from './mocks'
import { checkAuditMessage } from './testutils'
import { getPersonAppointment } from '../middleware'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'
const noteId = '5678'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getPersonActivitySpy = jest
  .spyOn(MasApiClient.prototype, 'postPersonActivityLog')
  .mockImplementation(() => Promise.resolve(mockActivities))

const getCalculationDetailsSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))

const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockPersonAppointment))

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', view: 'default', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'default', requirement: '' },
  },
})
req.flash = jest.fn().mockReturnValue([])

const reqCompact = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', view: 'compact', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'compact', requirement: '' },
  },
})
reqCompact.flash = jest.fn().mockReturnValue([])

const reqDefault = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
  },
  query: { page: '', requirement: '' },
  session: {
    activityLogFilters: { page: '', view: 'default', requirement: '' },
  },
})
reqDefault.flash = jest.fn().mockReturnValue([])

const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
  flags: {},
})

const renderSpy = jest.spyOn(res, 'render')

describe('/controllers/activityLogController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getOrPostActivityLog', () => {
    beforeEach(async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(req, res)
    })
    it('should set res.locals.compactView to true', async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqCompact, res)
      expect(res.locals.compactView).toEqual(true)
    })
    it('should set res.locals.defaultView to true', async () => {
      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqDefault, res)
      expect(res.locals.defaultView).toEqual(true)
    })
    checkAuditMessage(res, 'VIEW_MAS_ACTIVITY_LOG', uuidv4(), crn, 'CRN')
    it('should request the person activity from the api with size 25', () => {
      const expectedBody = {
        keywords: '',
        dateFrom: '',
        dateTo: '',
        filters: [] as string[],
        includeSystemGenerated: false,
        typeCodes: [] as string[],
      }
      expect(getPersonActivitySpy).toHaveBeenCalledWith(crn, expectedBody, req.query.page, '25')
      expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
    })

    it('should render the contact-log page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/contact-log', {
        personActivity: mockActivities,
        baseUrl: '',
        crn,
        query: req.query,
        queryParams: [],
        page: req.query.page,
        view: req.query.view,
        tierCalculation: mockTierCalculation,
        url: req.url,
        resultsStart: 1,
        resultsEnd: 1,
        errorMessages: undefined,
        groupedActivities: [
          {
            date: 'Thu 22 Dec 2044',
            activities: mockActivities.activities,
          },
        ],
      })
    })
    it('should redirect to clean URL and store flash when showSuccessBanner is in query', async () => {
      const reqWithBanner = httpMocks.createRequest({
        params: { crn, id, noteId },
        path: `/case/${crn}/activity-log`,
        query: { page: '', view: 'default', requirement: '', showSuccessBanner: 'true' },
        session: { activityLogFilters: { page: '', view: 'default', requirement: '' } },
      })
      reqWithBanner.flash = jest.fn().mockReturnValue([])
      const resWithBanner = mockAppResponse({
        filters: { dateFrom: '', dateTo: '', keywords: '' },
        flags: {},
      })
      const redirectSpy = jest.spyOn(resWithBanner, 'redirect')

      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqWithBanner, resWithBanner)

      expect(reqWithBanner.flash).toHaveBeenCalledWith('contactCreated', 'success')
      expect(redirectSpy).toHaveBeenCalled()
      expect(redirectSpy.mock.calls[0][0]).not.toContain('showSuccessBanner')
    })
    it('should calculate correct pagination when page is greater than 0', async () => {
      const reqWithPage = httpMocks.createRequest({
        params: { crn },
        query: { page: '1', view: 'default' },
        session: { activityLogFilters: {} },
      })
      reqWithPage.flash = jest.fn().mockReturnValue([])
      const resWithPage = mockAppResponse({
        filters: { dateFrom: '', dateTo: '', keywords: '' },
        flags: {},
      })
      const renderSpyWithPage = jest.spyOn(resWithPage, 'render')

      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqWithPage, resWithPage)

      expect(renderSpyWithPage).toHaveBeenCalledWith(
        'pages/contact-log',
        expect.objectContaining({
          resultsStart: 26,
          resultsEnd: 50,
        }),
      )
    })

    it('should redirect to clean URL without showSuccessBanner and store it in flash', async () => {
      const reqWithSuccess = httpMocks.createRequest({
        params: { crn },
        path: `/case/${crn}/activity-log`,
        query: { page: '', view: 'default', showSuccessBanner: 'true' },
        session: { activityLogFilters: {} },
      })
      reqWithSuccess.flash = jest.fn().mockReturnValue([])
      const resWithFlag = mockAppResponse({ filters: {}, flags: {} })
      const redirectSpy = jest.spyOn(resWithFlag, 'redirect')

      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqWithSuccess, resWithFlag)

      expect(reqWithSuccess.flash).toHaveBeenCalledWith('contactCreated', 'success')
      expect(redirectSpy).toHaveBeenCalled()
      expect(redirectSpy.mock.calls[0][0]).not.toContain('showSuccessBanner')
    })

    it('should store uploadFailed in flash and redirect to clean URL when uploadFailed is in query', async () => {
      const reqWithUploadFailed = httpMocks.createRequest({
        params: { crn },
        path: `/case/${crn}/activity-log`,
        query: { page: '', view: 'default', showSuccessBanner: 'true', uploadFailed: 'true' },
        session: { activityLogFilters: {} },
      })
      reqWithUploadFailed.flash = jest.fn().mockReturnValue([])
      const resWithFlag = mockAppResponse({ filters: {}, flags: {} })
      const redirectSpy = jest.spyOn(resWithFlag, 'redirect')

      await controllers.activityLog.getOrPostActivityLog(hmppsAuthClient)(reqWithUploadFailed, resWithFlag)

      expect(reqWithUploadFailed.flash).toHaveBeenCalledWith('contactCreated', 'uploadFailed')
      expect(redirectSpy).toHaveBeenCalled()
      expect(redirectSpy.mock.calls[0][0]).not.toContain('uploadFailed')
    })
  })
  describe('getActivity', () => {
    beforeEach(async () => {
      await controllers.activityLog.getActivity(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_ACTIVITY_LOG_DETAIL', uuidv4(), crn, 'CRN')
    it('should request the person appointment note', () => {
      expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
    })

    it('should render the activity page with showSuccessBanner true when flash exists', async () => {
      const reqWithFlash = httpMocks.createRequest({
        params: { crn, id },
        query: { view: 'default' },
        session: {},
      })

      reqWithFlash.flash = jest.fn().mockImplementation((key: string) => {
        if (key === 'contactUpdated') return ['success']
        return []
      })

      const resWithFlash = mockAppResponse({
        filters: {},
        flags: {},
      })

      const renderSpyWithFlash = jest.spyOn(resWithFlash, 'render')

      await controllers.activityLog.getActivity(hmppsAuthClient)(reqWithFlash, resWithFlash)

      expect(renderSpyWithFlash).toHaveBeenCalledWith(
        'pages/appointments/appointment',
        expect.objectContaining({
          showSuccessBanner: true,
        }),
      )
    })

    it('should render the activity page with showSuccessBanner false when the user returns to the page without flash data', async () => {
      const reqWithoutFlash = httpMocks.createRequest({
        params: { crn, id },
        query: { view: 'default' },
        session: {},
      })

      reqWithoutFlash.flash = jest.fn().mockImplementation((key: string) => {
        if (key === 'contactUpdated') return []
        return []
      })

      const resWithoutFlash = mockAppResponse({
        filters: {},
        flags: {},
      })

      const renderSpyWithoutFlash = jest.spyOn(resWithoutFlash, 'render')

      await controllers.activityLog.getActivity(hmppsAuthClient)(reqWithoutFlash, resWithoutFlash)

      expect(renderSpyWithoutFlash).toHaveBeenCalledWith(
        'pages/appointments/appointment',
        expect.objectContaining({
          showSuccessBanner: false,
        }),
      )
    })

    it('should set flash and redirect to clean URL when showSuccessBanner query exists', async () => {
      const reqAfterFlash = httpMocks.createRequest({
        params: { crn, id },
        path: `/case/${crn}/activity/${id}`,
        query: {
          showSuccessBanner: 'true',
        },
        session: {},
      })

      reqAfterFlash.flash = jest.fn()

      const redirectSpy = jest.spyOn(res, 'redirect')

      await controllers.activityLog.getActivity(hmppsAuthClient)(reqAfterFlash, res)

      expect(reqAfterFlash.flash).toHaveBeenCalledWith('contactUpdated', 'success')

      expect(redirectSpy).toHaveBeenCalledWith('/case/X000001/activity/1234')
    })

    it('should render the activity page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
        personAppointment: mockPersonAppointment,
        crn,
        id,
        back: undefined,
        queryParams: ['view=default'],
        isActivityLog: true,
        url: '',
        showSuccessBanner: false,
      })
    })
  })
})
