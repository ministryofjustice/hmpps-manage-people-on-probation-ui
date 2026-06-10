import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
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
import { Sentence, Sentences } from '../data/model/sentenceDetails'
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

jest.mock('../data/masApiClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../data/eSupervisionClient')
jest.mock('../middleware/existsInEMDI')
jest.mock('../middleware/getSentences')
jest.mock('../middleware/checkLocationMonitoring')

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
  content: [{ date: '2021-01-01' }, { date: '2025-01-02' }, { date: '2025-01-03' }],
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
const getSentencesMasSpy = jest.spyOn(MasApiClient.prototype, 'getSentences').mockImplementation(() =>
  Promise.resolve({
    personSummary: { name: overview.name, crn, dateOfBirth: overview.dateOfBirth },
    sentences: [],
  }),
)

const getSentencesSpy = getSentences as jest.Mock
const hasLocationMonitoringSpy = hasLocationMonitoring as jest.Mock
const existsInEMDISpy = existsInEMDI as jest.Mock

const res = mockAppResponse({
  flags: {
    enableOutcomesV1: true,
  },
})
const renderSpy = jest.spyOn(res, 'render')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

describe('caseController', () => {
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
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
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
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
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
      res.locals.flags = { enableESupervisionCheckins: true, enableOutcomesV1: true }
      await controllers.case.getCase(hmppsAuthClient)(req, res)
    })
    afterEach(() => {
      res.locals.flags = { enableOutcomesV1: true }
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
      res.locals.flags = { enableEMDIOverviewShowGPSData: true, enableOutcomesV1: true }
      res.locals.user = { username: 'test-user', authSource: 'nomis', token: 'token-1' }
      getSentencesMasSpy.mockResolvedValue({
        personSummary: { name: overview.name, crn, dateOfBirth: overview.dateOfBirth },
        sentences: [{ licenceConditions: [], requirements: [] }],
      } as any)
    })

    afterEach(() => {
      jest.clearAllMocks()
      res.locals.flags = { enableOutcomesV1: true }
      delete res.locals.locationMonitoringUri
      delete res.locals.sentences
    })

    it('should call getSentences and existsInEMDI when flag is enabled and location monitoring is present and data not in session', async () => {
      hasLocationMonitoringSpy.mockReturnValue(true)
      existsInEMDISpy.mockResolvedValue('http://emdi-uri')

      await controllers.case.getCase(hmppsAuthClient)(req, res)

      expect(getSentencesMasSpy).toHaveBeenCalledWith(crn)
      expect(hasLocationMonitoringSpy).toHaveBeenCalled()
      expect(existsInEMDISpy).toHaveBeenCalledWith(crn, 'token-1')
      expect(res.locals.locationMonitoringUri).toBe('http://emdi-uri')
      expect(req.session.data.sentencesWithRarDescription[crn]).toEqual([{ licenceConditions: [], requirements: [] }])
    })

    it('should use data from session and NOT call getSentences when data is already in session', async () => {
      const sessionSentences = [{ licenceConditions: [], requirements: [] }] as Sentence[]
      req.session.data.sentencesWithRarDescription = { [crn]: sessionSentences }
      hasLocationMonitoringSpy.mockReturnValue(true)
      existsInEMDISpy.mockResolvedValue('http://emdi-uri')

      await controllers.case.getCase(hmppsAuthClient)(req, res)

      expect(getSentencesMasSpy).not.toHaveBeenCalled()
      expect(res.locals.sentences).toEqual(sessionSentences)
      expect(existsInEMDISpy).toHaveBeenCalledWith(crn, 'token-1')
      expect(res.locals.locationMonitoringUri).toBe('http://emdi-uri')

      // Cleanup session for other tests
      delete req.session.data.sentencesWithRarDescription
    })

    it('should call getSentences but NOT existsInEMDI when flag is enabled but NO location monitoring is present', async () => {
      hasLocationMonitoringSpy.mockReturnValue(false)

      await controllers.case.getCase(hmppsAuthClient)(req, res)

      expect(getSentencesMasSpy).toHaveBeenCalledWith(crn)
      expect(hasLocationMonitoringSpy).toHaveBeenCalled()
      expect(existsInEMDISpy).not.toHaveBeenCalled()
      expect(res.locals.locationMonitoringUri).toBeUndefined()
    })

    it('should NOT call getSentences when flag is disabled', async () => {
      res.locals.flags.enableEMDIOverviewShowGPSData = false

      await controllers.case.getCase(hmppsAuthClient)(req, res)

      expect(getSentencesMasSpy).not.toHaveBeenCalled()
      expect(existsInEMDISpy).not.toHaveBeenCalled()
    })
  })
})
