import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { mockAppResponse, mockTierCalculation, mockPredictors, mockRisks, mockSanIndicatorResponse } from './mocks'
import { Overview } from '../data/model/overview'
import { Needs, PersonRiskFlags } from '../data/model/risk'
import { toPredictors, toRoshWidget } from '../utils'
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
} from '../data/model/personalDetails'
import { PersonalDetailsSession } from '../models/Data'
import { Contact } from '../data/model/professionalContact'

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

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const mockOverview = {} as Overview
const mockNeeds = {} as Needs
const mockRiskFlags = {} as PersonRiskFlags

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

const mockPersonalDetails: PersonalDetailsSession = {
  overview,
  sentencePlan: {
    lastUpdatedDate: '',
    showLink: false,
  },
  risks: mockRisks,
  tierCalculation: mockTierCalculation,
  predictors: mockPredictors,
}
const mockOverdueOutcomesResponse = {
  content: [{}, {}, {}],
}
const getOverviewSpy = jest
  .spyOn(MasApiClient.prototype, 'getOverview')
  .mockImplementation(() => Promise.resolve(mockOverview))
jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockImplementation(() => Promise.resolve(overview))
const needsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))
const getSanIndicatorSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getSanIndicator')
  .mockImplementation(() => Promise.resolve(mockSanIndicatorResponse))
const getPersonRiskFlagsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonRiskFlags')
  .mockImplementation(() => Promise.resolve(mockRiskFlags))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const getOverdueOutcomesSpy = jest
  .spyOn(MasApiClient.prototype, 'getOverdueOutcomes')
  .mockImplementation(() => Promise.resolve(mockOverdueOutcomesResponse as any))

const res = mockAppResponse()
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
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
      expect(getSanIndicatorSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the case overview page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/overview', {
        overview: mockOverview,
        needs: mockNeeds,
        personRisks: mockRiskFlags,
        risks: mockRisks,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
        appointmentsWithoutAnOutcomeCount: 3,
        hasDeceased: false,
        hasPractitioner: false,
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
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
      expect(getSanIndicatorSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the case overview page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/overview', {
        overview: mockOverview,
        needs: mockNeeds,
        personRisks: mockRiskFlags,
        risks: mockRisks,
        crn,
        tierCalculation: mockTierCalculation,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
        sanIndicator: true,
        personalDetails: req.session.data.personalDetails[crn].overview,
        appointmentsWithoutAnOutcomeCount: 3,
        hasDeceased: false,
        hasPractitioner: false,
      })
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
})
