/* eslint-disable import/no-extraneous-dependencies */
import { Readable } from 'stream'
import httpMocks from 'node-mocks-http'
import { ArnsComponents } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { AuthOptions } from '@ministryofjustice/hmpps-rest-client'
import { getPersonalDetails } from './getPersonalDetails'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import { RiskSummary } from '../data/model/risk'
import { toRoshWidget } from '../utils'
import {
  mockTierCalculation,
  mockPredictors,
  mockRisks,
  mockUserCaseload,
  mockAppResponse,
  mockSentencePlanResult,
  mockRiskData,
  probationPractitioner,
  mockPredictorScores,
  mockContacts,
} from '../controllers/mocks'
import { UserCaseload } from '../data/model/caseload'
import ArnsAssessmentPlatformApiClient from '../data/arnsAssessmentPlatformApiClient'
import { PersonalDetailsSession } from '../models/Data'
import {
  Circumstances,
  Disabilities,
  Name,
  PersonalContact,
  Provisions,
  Document,
  AddressType,
  PersonalDetails,
  Contact,
} from '../data/model/personalDetails'
import config from '../config'
import logger from '../../logger'

enum TokenType {
  USER_TOKEN = 'USER_TOKEN',
  SYSTEM_TOKEN = 'SYSTEM_TOKEN',
}

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/tierApiClient')
jest.mock('../data/arnsApiClient')
jest.mock('../data/prisonApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  toPredictors: jest.fn(() => mockPredictorScores),
}))

const mockAuthOptions: AuthOptions = {
  user: {
    username: 'user-1',
  },
  tokenType: TokenType.USER_TOKEN,
}

jest.mock('@ministryofjustice/hmpps-rest-client', () => ({
  ...jest.requireActual('@ministryofjustice/hmpps-rest-client'),
  asUser: jest.fn(() => mockAuthOptions),
}))

const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const authClient = new AuthenticationClient(config.apis.hmppsAuth, logger, tokenStore)
const arnsComponents = new ArnsComponents(authClient, config.apis.arnsApi, logger)
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const getRiskDataSpy = jest
  .spyOn(ArnsComponents.prototype, 'getRiskData')
  .mockImplementation(() => Promise.resolve(mockRiskData))
const searchUserCaseloadSpy = jest
  .spyOn(MasApiClient.prototype, 'searchUserCaseload')
  .mockImplementation(() => Promise.resolve(mockUserCaseload))
const getProbationPractitionerSpy = jest
  .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
  .mockImplementation(() => Promise.resolve(probationPractitioner))
const getContactsSpy = jest
  .spyOn(MasApiClient.prototype, 'getContacts')
  .mockImplementation(() => Promise.resolve(mockContacts))
let getPersonalDetailsSpy: jest.SpyInstance
let getSentencePlanByCrnSpy: jest.SpyInstance
let req: httpMocks.MockRequest<any>
let res: httpMocks.MockResponse<any>
let nextSpy: jest.Mock

const getReq = ({ ogrs4Enabled = true } = {}) =>
  httpMocks.createRequest({
    params: {
      crn: 'X000002',
    },
    session: {
      data: {
        personalDetails: {
          X000001: mock({ ogrs4Enabled }),
        },
      },
    },
  })

const getRes = () =>
  ({
    locals: {
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {},
    },
    redirect: jest.fn().mockReturnThis(),
  }) as unknown as AppResponse

const overview = (crn = 'X000001'): PersonalDetails => ({
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
})

const mock = ({ crn = 'X000001', lastUpdatedDate = '', ogrs4Enabled = true } = {}): PersonalDetailsSession => {
  const mockPersonalDetails: PersonalDetailsSession = {
    overview: overview(crn),
    sentencePlan: {
      lastUpdatedDate: mockSentencePlanResult.lastUpdatedDate,
      showLink: false,
      showText: true,
    },
    risks: mockRisks,
    tierCalculation: mockTierCalculation,
    probationPractitioner,
    professionalContact: mockContacts,
    arnsUnavailable: false,
    prisonsUnavailable: false,
  }
  if (ogrs4Enabled) {
    mockPersonalDetails.riskData = mockRiskData
  } else {
    mockPersonalDetails.predictors = mockPredictors
  }
  return mockPersonalDetails
}

describe('/middleware/getPersonalDetails', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    getPersonalDetailsSpy = jest.spyOn(MasApiClient.prototype, 'getPersonalDetails')
    getSentencePlanByCrnSpy = jest
      .spyOn(ArnsAssessmentPlatformApiClient.prototype, 'getSentencePlanByCrn')
      .mockImplementation(() => Promise.resolve(mockSentencePlanResult))
    nextSpy = jest.fn()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  describe('OGRS4 feature flag is enabled', () => {
    it('should request data from the api if personal details for crn does not exist in the session and env is not development', async () => {
      process.env.NODE_ENV = 'production'
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = {
        locals: {
          user: {
            username: 'user-1',
            roles: ['SENTENCE_PLAN'],
          },
          flags: {},
        },
        redirect: jest.fn().mockReturnThis(),
      } as unknown as AppResponse
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      const expected = {
        personalDetails: {
          X000001: mock(),
          X000002: mock({ crn: 'X000002', lastUpdatedDate: '' }),
        },
      }

      expect(getPersonalDetailsSpy).toHaveBeenCalledWith(req.params.crn)
      expect(risksSpy).toHaveBeenCalledWith(req.params.crn)
      expect(tierCalculationSpy).toHaveBeenCalledWith(req.params.crn)
      expect(searchUserCaseloadSpy).toHaveBeenCalledWith(res.locals.user.username, '', '', {
        nameOrCrn: req.params.crn,
      })
      expect(getProbationPractitionerSpy).toHaveBeenCalledWith(req.params.crn)
      expect(getContactsSpy).toHaveBeenCalledWith(req.params.crn)
      expect(getRiskDataSpy).toHaveBeenCalledWith(mockAuthOptions, 'crn', 'X000002')
      expect(predictorsSpy).not.toHaveBeenCalled()
      expect(getSentencePlanByCrnSpy).toHaveBeenCalledWith('X000002', 'user-1')
      expect(req.session.data).toEqual(expected)
      expect(res.locals.case).toEqual(overview('X000002'))
      expect(res.locals.risksWidget).toEqual(toRoshWidget(mockRisks))
      expect(res.locals.tierCalculation).toEqual(mockTierCalculation)
      expect(res.locals.riskData).toEqual(mockRiskData)
      expect(res.locals.predictorScores).toBeUndefined()
      expect(res.locals.headerPersonName).toEqual({ forename: `Caroline`, surname: `Wolff` })
      expect(res.locals.headerCRN).toEqual(req.params.crn)
      expect(res.locals.headerDob).toEqual('1979-08-18')
      expect(res.locals.headerTierLink).toEqual('https://tier-dummy-url/X000002')
      expect(res.locals.managedBy).toEqual({
        text: 'Arhsimna Xolfo (All London)',
        href: '/case/X000002/personal-details/staff-contacts',
      })
      expect(nextSpy).toHaveBeenCalled()
    })

    it('should not request data from the api if personal details for crn already exist in the session and env is not development', async () => {
      process.env.NODE_ENV = 'production'
      req = httpMocks.createRequest({
        params: {
          crn: 'X000002',
        },
        session: {
          data: {
            personalDetails: {
              X000001: mock(),
              X000002: mock({ crn: 'X000002' }),
            },
          },
        },
      })
      res = {
        locals: {
          user: {
            username: 'user-1',
            roles: ['SENTENCE_PLAN'],
          },
          flags: {},
        },
        redirect: jest.fn().mockReturnThis(),
      } as unknown as AppResponse
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(getPersonalDetailsSpy).not.toHaveBeenCalled()
      expect(risksSpy).not.toHaveBeenCalled()
      expect(tierCalculationSpy).not.toHaveBeenCalled()
      expect(searchUserCaseloadSpy).not.toHaveBeenCalled()
      expect(getRiskDataSpy).not.toHaveBeenCalled()
      expect(predictorsSpy).not.toHaveBeenCalled()
      expect(res.locals.case).toEqual(overview('X000002'))
      expect(res.locals.risksWidget).toEqual(toRoshWidget(mockRisks))
      expect(res.locals.tierCalculation).toEqual(mockTierCalculation)
      expect(res.locals.headerPersonName).toEqual({ forename: 'Caroline', surname: 'Wolff' })
      expect(res.locals.headerCRN).toEqual(req.params.crn)
      expect(res.locals.headerDob).toEqual('1979-08-18')
      expect(res.locals.headerTierLink).toEqual('https://tier-dummy-url/X000002')
      expect(res.locals.dateOfDeath).toBeUndefined()
      expect(res.locals.riskData).toEqual(mockRiskData)
      expect(res.locals.predictorScores).toBeUndefined()
      expect(nextSpy).toHaveBeenCalled()
    })
  })

  describe('photo', () => {
    it('sets personPhotoSrc to the prisoner-image route when a photo exists', async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getPersonalDetails')
        .mockResolvedValueOnce({ ...overview('X000002'), noms: 'A1234BC' })
      jest.spyOn(PrisonApiClient.prototype, 'getImageData').mockResolvedValueOnce(Readable.from(['image-bytes']))
      req = getReq()
      res = getRes()
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.personPhotoSrc).toBe('/search/prisoner-image/A1234BC')
    })

    it('leaves personPhotoSrc undefined, and prisonsUnavailable false, when there is no photo (404)', async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getPersonalDetails')
        .mockResolvedValueOnce({ ...overview('X000002'), noms: 'A1234BC' })
      jest.spyOn(PrisonApiClient.prototype, 'getImageData').mockResolvedValueOnce(null)
      req = getReq()
      res = getRes()
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.personPhotoSrc).toBeUndefined()
      expect(res.locals.prisonsUnavailable).toBe(false)
    })

    it('leaves personPhotoSrc undefined, sets prisonsUnavailable, and still renders the header, when the Prisons API fails and enablePersonHeader is on', async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getPersonalDetails')
        .mockResolvedValueOnce({ ...overview('X000002'), noms: 'A1234BC' })
      jest.spyOn(PrisonApiClient.prototype, 'getImageData').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.personPhotoSrc).toBeUndefined()
      expect(res.locals.prisonsUnavailable).toBe(true)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('still renders the header (no crash) but leaves prisonsUnavailable false when enablePersonHeader is off - the photo fetch has always been caught defensively, independent of this flag', async () => {
      jest
        .spyOn(MasApiClient.prototype, 'getPersonalDetails')
        .mockResolvedValueOnce({ ...overview('X000002'), noms: 'A1234BC' })
      jest.spyOn(PrisonApiClient.prototype, 'getImageData').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.personPhotoSrc).toBeUndefined()
      expect(res.locals.prisonsUnavailable).toBe(false)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('does not request a photo when there is no NOMS number', async () => {
      const getImageDataSpy = jest.spyOn(PrisonApiClient.prototype, 'getImageData')
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes()
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(getImageDataSpy).not.toHaveBeenCalled()
      expect(res.locals.personPhotoSrc).toBeUndefined()
    })
  })

  describe('arns', () => {
    it('sets arnsUnavailable and still renders the header when getRisks fails and enablePersonHeader is on', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('sets arnsUnavailable and still renders the header when getRiskData fails and enablePersonHeader is on', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsComponents.prototype, 'getRiskData').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(nextSpy).toHaveBeenCalled()
    })

    it('sets arnsUnavailable when getRisks resolves an error-summary object (real 500/401 behaviour, not a rejection)', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockResolvedValueOnce({
        errors: [{ text: 'Risk information from the ARNS service is currently unavailable.' }],
      } as unknown as RiskSummary)
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(res.locals.risksWidget.overallRisk).toBe('NOT_FOUND')
      expect(nextSpy).toHaveBeenCalled()
    })

    it('sets arnsUnavailable when getRiskData resolves a non-200/404 httpStatus (real 500/401 behaviour, not a rejection)', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsComponents.prototype, 'getRiskData').mockResolvedValueOnce({ assessments: [], httpStatus: 500 })
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(res.locals.riskData).toBeNull()
      expect(nextSpy).toHaveBeenCalled()
    })

    it('leaves arnsUnavailable false when getRiskData resolves httpStatus 404 (legitimately no data, not a failure)', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsComponents.prototype, 'getRiskData').mockResolvedValueOnce({ assessments: [], httpStatus: 404 })
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(false)
    })

    it('leaves arnsUnavailable false when both ARNS calls succeed', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes()
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(false)
    })

    it('does not isolate an ARNS getRisks failure when enablePersonHeader is off (legacy header keeps the old crash behaviour)', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()

      await expect(getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)).rejects.toThrow('500')

      expect(nextSpy).not.toHaveBeenCalled()
    })

    it('does not isolate an ARNS getRiskData failure when enablePersonHeader is off (legacy header keeps the old crash behaviour)', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsComponents.prototype, 'getRiskData').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()

      await expect(getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)).rejects.toThrow('500')

      expect(nextSpy).not.toHaveBeenCalled()
    })

    it('does not cache a degraded (arnsUnavailable) result, so the next request for this CRN retries', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(req.session.data.personalDetails.X000002).toBeUndefined()
    })

    it('still initialises req.session.data on a degraded result when it did not exist yet, so downstream middleware (e.g. getPersonRiskFlags) does not crash on a fresh session', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockResolvedValueOnce(overview('X000002'))
      jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockRejectedValueOnce(new Error('500'))
      req = httpMocks.createRequest({ params: { crn: 'X000002' }, session: {} })
      res = getRes()
      res.locals.flags = { enablePersonHeader: true }
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(res.locals.arnsUnavailable).toBe(true)
      expect(req.session.data).toBeDefined()
      expect(req.session.data.personalDetails?.X000002).toBeUndefined()
    })
  })

  describe('ndelius', () => {
    it('AC1: does not isolate an NDelius (MAS personal details) failure, so it fails the whole page', async () => {
      jest.spyOn(MasApiClient.prototype, 'getPersonalDetails').mockRejectedValueOnce(new Error('500'))
      req = getReq()
      res = getRes()

      await expect(getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)).rejects.toThrow('500')

      expect(nextSpy).not.toHaveBeenCalled()
      expect(res.locals.headerCRN).toBeUndefined()
    })
  })

  it('should set the local variable if date of death is recorded', async () => {
    req = getReq()
    res = getRes()
    const dateOfDeath = '2025-11-15'
    getPersonalDetailsSpy.mockImplementationOnce(() =>
      Promise.resolve({
        ...overview('X000002'),
        dateOfDeath,
      } as PersonalDetails),
    )
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.dateOfDeath).toEqual(dateOfDeath)
  })

  it('should not request the sentence plan if logged in user does not have SENTENCE_PLAN role', async () => {
    req = getReq()
    res = {
      locals: {
        user: {
          username: 'user-1',
          roles: [],
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse

    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(getSentencePlanByCrnSpy).not.toHaveBeenCalled()
  })

  it('should set the correct sentence plan local variables if user has SENTENCE_PLAN role, pop has AGREED sentence plan and pop not in caseload', async () => {
    const mockedUserCaseload: UserCaseload = { ...mockUserCaseload, caseload: [] }
    req = getReq()
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {},
    })
    jest
      .spyOn(MasApiClient.prototype, 'searchUserCaseload')
      .mockImplementationOnce(() => Promise.resolve(mockedUserCaseload))
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      showText: true,
      lastUpdatedDate: mockSentencePlanResult.lastUpdatedDate,
    })
  })

  it('should set the correct sentence plan local variables if user does not have sentence plan role', async () => {
    req = getReq()
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: [],
      },
      flags: {},
    })
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      showText: false,
      lastUpdatedDate: '',
    })
  })

  it('should set the correct sentence plan local variables if user has sentence plan role, pop has AGREED sentence plan status and pop in user caseload', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest
      .spyOn(ArnsAssessmentPlatformApiClient.prototype, 'getSentencePlanByCrn')
      .mockImplementationOnce(() => Promise.resolve(mockSentencePlanResult))
    req = httpMocks.createRequest({
      params: {
        crn: 'X000001',
      },
      session: {
        data: {},
      },
    })
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {},
    })
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: true,
      showText: false,
      lastUpdatedDate: mockSentencePlanResult.lastUpdatedDate,
    })
  })

  it('should set the correct sentence plan local variables if user has sentence plan role, pop has DRAFT sentence plan status and pop in user caseload', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest
      .spyOn(ArnsAssessmentPlatformApiClient.prototype, 'getSentencePlanByCrn')
      .mockImplementationOnce(() => Promise.resolve({ hasAgreedPlan: false, lastUpdatedDate: '2025-10-01T16:39:23Z' }))
    req = httpMocks.createRequest({
      params: {
        crn: 'X000001',
      },
      session: {
        data: {},
      },
    })
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {},
    })
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      showText: false,
      lastUpdatedDate: '',
    })
  })

  it('should set the correct sentence plan local variables if user has sentence plan role, pop has AGREED sentence plan and pop not in user caseload', async () => {
    const mockedUserCaseload: UserCaseload = { ...mockUserCaseload, caseload: [] }
    jest
      .spyOn(MasApiClient.prototype, 'searchUserCaseload')
      .mockImplementationOnce(() => Promise.resolve(mockedUserCaseload))
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest
      .spyOn(ArnsAssessmentPlatformApiClient.prototype, 'getSentencePlanByCrn')
      .mockImplementationOnce(() => Promise.resolve(mockSentencePlanResult))
    req = httpMocks.createRequest({
      params: {
        crn: 'X000001',
      },
      session: {
        data: {},
      },
    })
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {},
    })
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      showText: true,
      lastUpdatedDate: mockSentencePlanResult.lastUpdatedDate,
    })
  })

  it('should set the correct sentence plan local variables if pop has no sentence plan', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest
      .spyOn(ArnsAssessmentPlatformApiClient.prototype, 'getSentencePlanByCrn')
      .mockImplementationOnce(() => Promise.resolve(null))
    req = getReq()
    res = mockAppResponse({
      user: {
        username: 'user-1',
        roles: [],
      },
      flags: {},
    })
    await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      showText: false,
      lastUpdatedDate: '',
    })
  })
})
