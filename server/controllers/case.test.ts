import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { eligibilityCheckDisabled } from '../utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { existsInEMDI } from '../middleware/existsInEMDI'
import { getSentences } from '../middleware'
import { hasLocationMonitoring } from '../middleware/checkLocationMonitoring'
import {
  mockAppResponse,
  mockTierCalculation,
  mockPredictors,
  mockRisks,
  mockSanIndicatorResponse,
  mockRiskData,
} from './mocks'
import { Overview } from '../data/model/overview'
import { Needs } from '../data/model/risk'
import { checkAuditMessage } from './testutils'
import {
  AddressType,
  Circumstances,
  Disabilities,
  Name,
  PersonalContact,
  PersonalDetails,
  Provisions,
  Document,
  Contact,
} from '../data/model/personalDetails'
import { PersonalDetailsSession } from '../models/Data'
import { ProbationPractitioner } from '../models/CaseDetail'
import ESupervisionClient from '../data/eSupervisionClient'
import { OffenderEligibility } from '../data/model/esupervision'
import { getThroughcareRows } from '../utils/throughcare'
import { SummaryListRow } from '../@types'
import { Prisoner } from '../data/prisonerSearchApiClient'

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

const mockMiddlewareFn = jest.fn()

jest.mock('../middleware', () => {
  const actualMiddleware = jest.requireActual('../middleware')
  return {
    ...actualMiddleware,
    getSentences: jest.fn(() => mockMiddlewareFn),
  }
})

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../data/eSupervisionClient')
jest.mock('../middleware/existsInEMDI')
jest.mock('../middleware/checkLocationMonitoring')
jest.mock('../utils/throughcare')

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const mockOverview = {} as Overview
const mockNeeds = {} as Needs

const overview: PersonalDetails = {
  name: {
    forename: 'Caroline',
    surname: 'Wolff',
  },
  crn,
  contacts: [] as PersonalContact[],
  otherAddressCount: 0,
  previousAddressCount: 0,
  preferredGender: 'male',
  dateOfBirth: '1979-08-18',
  aliases: [] as Name[],
  circumstances: {} as Circumstances,
  disabilities: {} as Disabilities,
  provisions: {} as Provisions,
  sex: 'male',
  documents: [] as Document[],
  addressTypes: [] as AddressType[],
  staffContacts: [] as Contact[],
}

const mockPractitioner: ProbationPractitioner = {
  code: '',
  name: { forename: '', surname: '' },
  provider: { code: '', name: '' },
  team: { code: '', description: '' },
  unallocated: false,
  username: '',
}

const mockPersonalDetails: PersonalDetailsSession = {
  overview,
  sentencePlan: {
    lastUpdatedDate: '',
    showLink: false,
    showText: false,
  },
  risks: mockRisks,
  tierCalculation: mockTierCalculation,
  predictors: mockPredictors,
  riskData: mockRiskData,
}
const mockOverdueOutcomesResponse = {
  content: [{ date: '2025-01-03' }, { date: '2026-08-10' }, { date: '2026-09-10' }],
}

const mockOffenderEligibilityResponse: OffenderEligibility = {
  outcome: 'ELIGIBLE',
  message: 'This person is eligible for online check ins',
}

const getOverviewSpy = jest
  .spyOn(MasApiClient.prototype, 'getOverview')
  .mockImplementation(() => Promise.resolve(mockOverview))
jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockImplementation(() => Promise.resolve(overview))
const needsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))
const getSanIndicatorSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getSanIndicator')
  .mockImplementation(() => Promise.resolve(mockSanIndicatorResponse))
jest.spyOn(ArnsApiClient.prototype, 'getPredictorsAll').mockImplementation(() => Promise.resolve(mockPredictors))
jest
  .spyOn(MasApiClient.prototype, 'getOverdueOutcomes')
  .mockImplementation(() => Promise.resolve(mockOverdueOutcomesResponse as any))
const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(undefined))

const getOffenderEligibilitySpy = jest
  .spyOn(ESupervisionClient.prototype, 'getOffenderEligibility')
  .mockImplementation(() => Promise.resolve(mockOffenderEligibilityResponse))

const getSentencesSpy = getSentences as jest.MockedFunction<typeof getSentences>
const hasLocationMonitoringSpy = hasLocationMonitoring as jest.Mock
const existsInEMDISpy = existsInEMDI as jest.Mock
const getThroughcareSpy = getThroughcareRows as jest.MockedFunction<typeof getThroughcareRows>
const preloadActivitySearchSpy = jest
  .spyOn(MasApiClient.prototype, 'preloadActivitySearch')
  .mockImplementation(() => Promise.resolve(undefined))

const res = mockAppResponse({
  flags: { enable3MonthsOutcomes: true },
  tierCalculation: mockTierCalculation,
})
const renderSpy = jest.spyOn(res, 'render')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

describe('caseController', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getCase', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      query: {
        sentenceNumber: '123',
      },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    beforeEach(async () => {
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_OVERVIEW', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(getOverviewSpy).toHaveBeenCalledWith(crn, req.query.sentenceNumber)
      expect(needsSpy).toHaveBeenCalledWith(crn)
      expect(getSanIndicatorSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the case overview page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/overview', {
        overview: mockOverview,
        needs: mockNeeds,
        crn,
        url: encodeURIComponent(req.url),
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
        checkinEligibility: eligibilityCheckDisabled,
        appointmentsWithoutAnOutcomeCount: 2,
        hasDeceased: false,
        hasPractitioner: false,
        canAccessCheckins: false,
      })
    })
  })

  describe('getCaseNoSentenceNumber', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    beforeEach(async () => {
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_OVERVIEW', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(getOverviewSpy).toHaveBeenCalledWith(crn, '')
      expect(needsSpy).toHaveBeenCalledWith(crn)
      expect(getSanIndicatorSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the case overview page', () => {
      getProbationPractitionerSpy.mockImplementationOnce(() => Promise.resolve(mockPractitioner))
      expect(renderSpy).toHaveBeenCalledWith('pages/overview', {
        overview: mockOverview,
        needs: mockNeeds,
        crn,
        url: encodeURIComponent(req.url),
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
        checkinEligibility: eligibilityCheckDisabled,
        appointmentsWithoutAnOutcomeCount: 2,
        hasDeceased: false,
        hasPractitioner: false,
        canAccessCheckins: false,
      })
    })
  })
  describe('getCase - checkins flag enabled and practitioner allocated', () => {
    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    beforeEach(async () => {
      getProbationPractitionerSpy.mockImplementationOnce(() => Promise.resolve(mockPractitioner))
      res.locals.flags = { enableESupervisionCheckins: true }
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })

    it('should render the overview page with canAccessCheckins true', () => {
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({
          hasPractitioner: true,
          canAccessCheckins: true,
        }),
      )
    })
  })
  describe('getCase - checkin eligibility returned', () => {
    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    beforeEach(async () => {
      getProbationPractitionerSpy.mockImplementationOnce(() => Promise.resolve(mockPractitioner))
      res.locals.flags = { enableOutcomesV1: true, enableEsupEligibilityCheck: true }
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })
    afterEach(() => {
      res.locals.flags = { enableOutcomesV1: true }
    })

    it('should render the overview page with canAccessCheckins true', () => {
      expect(getOffenderEligibilitySpy).toHaveBeenCalledWith(crn)
      expect(renderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({
          checkinEligibility: { message: 'This person is eligible for online check ins', outcome: 'ELIGIBLE' },
        }),
      )
    })

    it('should soften a tier-based eligibility message to may be eligible', async () => {
      getOffenderEligibilitySpy.mockResolvedValueOnce({
        outcome: 'ELIGIBLE',
        message: '    Alton Berge are in Tiers D-G.',
      })
      const tierRes = mockAppResponse({
        flags: { enableOutcomesV1: true, enableEsupEligibilityCheck: true },
        tierCalculation: mockTierCalculation,
        headerPersonName: { forename: 'Alton', surname: 'Berge' },
      })
      const tierRenderSpy = jest.spyOn(tierRes, 'render')
      await controllers.case.getCase(hmppsAuthClient)(req, tierRes)
      expect(tierRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({
          checkinEligibility: { outcome: 'ELIGIBLE', message: 'Alton Berge may be eligible for online check ins.' },
        }),
      )
    })

    it('should mark the person as ineligible for check ins when no tier has been assigned', async () => {
      const noTierRes = mockAppResponse({
        flags: { enableOutcomesV1: true, enableEsupEligibilityCheck: true },
        tierCalculation: null,
        headerPersonName: { forename: 'Alton', surname: 'Berge' },
      })
      const noTierRenderSpy = jest.spyOn(noTierRes, 'render')
      await controllers.case.getCase(hmppsAuthClient)(req, noTierRes)
      expect(noTierRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({
          checkinEligibility: {
            outcome: 'INELIGIBLE',
            message: 'Alton Berge is not eligible for online check ins because they have not been assigned a tier yet.',
          },
        }),
      )
    })

    it('should keep the person eligible when no tier has been assigned but they are already set up for check ins', async () => {
      jest.spyOn(ESupervisionClient.prototype, 'getOffenderCheckinsByCRN').mockResolvedValueOnce({
        uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        crn,
        status: 'VERIFIED',
        firstCheckin: '2025-11-03',
        checkinInterval: 'WEEKLY',
        mode: 'SCHEDULED',
        contactPreference: 'PHONE',
      })
      const noTierRes = mockAppResponse({
        flags: { enableOutcomesV1: true, enableEsupEligibilityCheck: true },
        tierCalculation: null,
        headerPersonName: { forename: 'Alton', surname: 'Berge' },
      })
      const noTierRenderSpy = jest.spyOn(noTierRes, 'render')
      await controllers.case.getCase(hmppsAuthClient)(req, noTierRes)
      expect(noTierRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({ checkinEligibility: mockOffenderEligibilityResponse }),
      )
    })

    it('should skip the eligibility check and treat the person as eligible when the flag is off', async () => {
      const flagOffRes = mockAppResponse({
        flags: { enableOutcomesV1: true, enableEsupEligibilityCheck: false },
        tierCalculation: null,
        headerPersonName: { forename: 'Alton', surname: 'Berge' },
      })
      const flagOffRenderSpy = jest.spyOn(flagOffRes, 'render')
      getOffenderEligibilitySpy.mockClear()
      await controllers.case.getCase(hmppsAuthClient)(req, flagOffRes)
      expect(getOffenderEligibilitySpy).not.toHaveBeenCalled()
      expect(flagOffRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({ checkinEligibility: eligibilityCheckDisabled }),
      )
    })
  })
  it('should default appointmentsWithoutAnOutcomeCount to 0 when no content is returned', async () => {
    jest.spyOn(MasApiClient.prototype, 'getOverdueOutcomes').mockResolvedValueOnce({} as any)

    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })

    await controllers.case.getCase(hmppsAuthClient)(req, res)

    expect(renderSpy).toHaveBeenCalledWith(
      'pages/overview',
      expect.objectContaining({
        appointmentsWithoutAnOutcomeCount: 0,
      }),
    )
  })
  it('should return 0 when overdue outcomes content is empty', async () => {
    jest.spyOn(MasApiClient.prototype, 'getOverdueOutcomes').mockResolvedValueOnce({ content: [] } as any)

    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })

    await controllers.case.getCase(hmppsAuthClient)(req, res)

    expect(renderSpy).toHaveBeenCalledWith(
      'pages/overview',
      expect.objectContaining({
        appointmentsWithoutAnOutcomeCount: 0,
      }),
    )
  })

  it('should render sanIndicator as false when response indicates false', async () => {
    jest.spyOn(ArnsApiClient.prototype, 'getSanIndicator').mockResolvedValueOnce({ sanIndicator: false } as any)

    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })

    await controllers.case.getCase(hmppsAuthClient)(req, res)

    expect(renderSpy).toHaveBeenCalledWith(
      'pages/overview',
      expect.objectContaining({
        sanIndicator: false,
      }),
    )
  })
  it('should propagate error when overdue outcomes call fails', async () => {
    jest.spyOn(MasApiClient.prototype, 'getOverdueOutcomes').mockRejectedValueOnce(new Error('API failure'))

    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    await expect(controllers.case.getCase(hmppsAuthClient)(req, res)).rejects.toThrow('API failure')
  })

  describe('getCase - GPS data logic (EMDI)', () => {
    const req = httpMocks.createRequest({
      params: { crn },
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })

    beforeEach(() => {
      res.locals.flags = {}
      res.locals.user = { username: 'test-user', authSource: 'nomis', token: 'token-1' }
      getSentencesSpy.mockImplementation(() => (r: any, s: any, next: any): any => {
        const { locals } = s
        locals.sentences = [{ licenceConditions: [], requirements: [] }]
        next()
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
      delete res.locals.sentences
    })

    it('should call getSentences and existsInEMDI when flag is enabled and location monitoring is present', async () => {
      hasLocationMonitoringSpy.mockReturnValue(true)
      existsInEMDISpy.mockResolvedValue({ uri: 'https://emdi-uri' })
      await controllers.case.getCase(hmppsAuthClient)(req, res)
      expect(getSentencesSpy).toHaveBeenCalled()
      expect(hasLocationMonitoringSpy).toHaveBeenCalled()
      expect(existsInEMDISpy).toHaveBeenCalledWith(crn, 'token-1')
    })

    it('should call getSentences but NOT existsInEMDI when NO location monitoring is present', async () => {
      hasLocationMonitoringSpy.mockReturnValue(false)
      await controllers.case.getCase(hmppsAuthClient)(req, res)
      expect(getSentencesSpy).toHaveBeenCalled()
      expect(hasLocationMonitoringSpy).toHaveBeenCalled()
      expect(existsInEMDISpy).not.toHaveBeenCalled()
    })
  })

  describe('getCase - semantic search preload', () => {
    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: mockPersonalDetails,
          },
        },
      },
    })
    afterEach(() => {
      res.locals.flags = {}
    })
    it('should call preloadActivitySearch when enableSemanticSearch is enabled', async () => {
      res.locals.flags = { enableSemanticSearch: true }
      await controllers.case.getCase(hmppsAuthClient)(req, res)
      expect(preloadActivitySearchSpy).toHaveBeenCalledWith(crn)
    })

    it('should NOT call preloadActivitySearch when enableSemanticSearch is disabled', async () => {
      await controllers.case.getCase(hmppsAuthClient)(req, res)
      expect(preloadActivitySearchSpy).not.toHaveBeenCalled()
    })
  })

  describe('getCase - throughcare', () => {
    const noms = 'A1234BC'
    const mockPrisoner: Prisoner = { status: 'ACTIVE IN', inOutStatus: 'IN', prisonName: 'Whatton' }
    const mockThroughcareRows: SummaryListRow[] = [
      { key: { text: 'Prison offender manager (POM)' }, value: { text: 'Dove, Rachel' } },
      { key: { text: 'Current prison' }, value: { text: 'Whatton' } },
      { key: { text: 'Responsible officer expected handover date' }, value: { text: '2026-11-06' } },
      { key: { text: 'Release date' }, value: { text: '2027-03-16' } },
    ]
    const req = httpMocks.createRequest({
      params: { crn },
      url: '/caseload/appointments/upcoming',
      session: {
        data: {
          personalDetails: {
            [crn]: { ...mockPersonalDetails, overview: { ...overview, noms } },
          },
        },
      },
    })

    it('should request and render the throughcare information when enableNewOverview is enabled', async () => {
      getThroughcareSpy.mockResolvedValueOnce(mockThroughcareRows)
      const throughcareRes = mockAppResponse({
        flags: { enableNewOverview: true },
        tierCalculation: mockTierCalculation,
        prisoner: mockPrisoner,
      })
      const throughcareRenderSpy = jest.spyOn(throughcareRes, 'render')
      await controllers.case.getCase(hmppsAuthClient)(req, throughcareRes)
      expect(getThroughcareSpy).toHaveBeenCalledWith('token-1', noms, mockPrisoner)
      expect(throughcareRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({ throughcareRows: mockThroughcareRows }),
      )
    })

    it('should NOT request the throughcare information when enableNewOverview is disabled', async () => {
      const throughcareRes = mockAppResponse({
        flags: { enableNewOverview: false },
        tierCalculation: mockTierCalculation,
        prisoner: mockPrisoner,
      })
      const throughcareRenderSpy = jest.spyOn(throughcareRes, 'render')
      await controllers.case.getCase(hmppsAuthClient)(req, throughcareRes)
      expect(getThroughcareSpy).not.toHaveBeenCalled()
      expect(throughcareRenderSpy).toHaveBeenCalledWith(
        'pages/overview',
        expect.objectContaining({ throughcareRows: undefined }),
      )
    })
  })
})
