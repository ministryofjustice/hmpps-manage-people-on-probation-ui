/* eslint-disable import/no-extraneous-dependencies */
import httpMocks from 'node-mocks-http'
import { ArnsComponents } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { AuthOptions } from '@ministryofjustice/hmpps-rest-client'
import { fetchTierDetails, getPersonalDetails } from './getPersonalDetails'
import MasApiClient from '../data/masApiClient'
import TierApiClient, { LatestTier, LatestTierResponse } from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
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
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('@ministryofjustice/hmpps-mpop-frontend-components-lib', () => ({
  ...jest.requireActual('@ministryofjustice/hmpps-mpop-frontend-components-lib'),
  MPoPComponents: jest.fn().mockImplementation(() => ({ getTierDetails: jest.fn() })),
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
const mpopComponents = jest.mocked(new MPoPComponents(authClient, config.apis.tierApi, logger))
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

const getRes = (enableSupervisionPackage: boolean = false, roles: Array<string> = ['SENTENCE_PLAN']) =>
  ({
    locals: {
      user: {
        username: 'user-1',
        roles,
      },
      flags: {
        enableSupervisionPackage,
      },
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

  const calculation = {
    provisional: true,
    tierScore: 'B2',
  } as Partial<LatestTier>

  describe('enableSupervisionPackage', () => {
    beforeEach(() => {
      mpopComponents.getTierDetails.mockResolvedValue({ calculation: calculation as LatestTier, httpStatus: 200 })
    })

    it('should request tierDetails if feature is enabled', async () => {
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).toHaveBeenCalled()
      expect(res.locals.tierDetails).toEqual({ calculation: { provisional: true, tierScore: 'B2' }, httpStatus: 200 })
    })

    it('should not request tierDetails if feature is disabled', async () => {
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes(false)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeFalsy()
    })

    it('should fetch tierDetails when personal details are cached but tierDetails is missing', async () => {
      req = httpMocks.createRequest({
        params: {
          crn: 'X000002',
        },
        session: {
          data: {
            personalDetails: {
              X000002: mock({ crn: 'X000002' }),
            },
          },
        },
      })
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).toHaveBeenCalled()
      expect(res.locals.tierDetails).toEqual({ calculation: { provisional: true, tierScore: 'B2' }, httpStatus: 200 })
    })

    it('should not fetch tierDetails when cached personal details already contain tierDetails', async () => {
      const cachedTierDetails = {
        calculation: { provisional: true, tierScore: 'A1' } as LatestTier,
        httpStatus: 200,
      }
      const cached = mock({ crn: 'X000002' })
      cached.tierDetails = cachedTierDetails
      req = httpMocks.createRequest({
        params: { crn: 'X000002' },
        session: {
          data: {
            personalDetails: {
              X000002: cached,
            },
          },
        },
      })
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
      expect(res.locals.tierDetails).toEqual(cachedTierDetails)
    })

    it('should not fetch tierDetails when cached personal details exist and feature flag is disabled', async () => {
      req = httpMocks.createRequest({
        params: { crn: 'X000002' },
        session: {
          data: {
            personalDetails: {
              X000002: mock({ crn: 'X000002' }),
            },
          },
        },
      })
      res = getRes(false)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeUndefined()
    })

    it('should not attempt to fetch tierDetails when mpopComponents is not provided and personal details are uncached', async () => {
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeUndefined()
    })

    it('should not attempt to fetch tierDetails when mpopComponents is not provided and personal details are cached', async () => {
      req = httpMocks.createRequest({
        params: { crn: 'X000002' },
        session: {
          data: {
            personalDetails: {
              X000002: mock({ crn: 'X000002' }),
            },
          },
        },
      })
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeUndefined()
    })

    it('should set res.locals.tierDetails to undefined when calculation is not provisional', async () => {
      mpopComponents.getTierDetails.mockResolvedValueOnce({
        calculation: { provisional: false, tierScore: 'B2' } as LatestTier,
        httpStatus: 200,
      })
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeUndefined()
    })

    it('should set res.locals.tierDetails to undefined when tierScore is missing', async () => {
      mpopComponents.getTierDetails.mockResolvedValueOnce({
        calculation: { provisional: true } as LatestTier,
        httpStatus: 200,
      })
      getPersonalDetailsSpy.mockResolvedValueOnce(overview('X000002'))
      req = getReq()
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(mpopComponents.getTierDetails).toHaveBeenCalled()
      expect(res.locals.tierDetails).toBeUndefined()
    })

    it('should persist fetched tierDetails to the session when refreshing cached personal details', async () => {
      const cached = mock({ crn: 'X000002' })
      req = httpMocks.createRequest({
        params: { crn: 'X000002' },
        session: {
          data: {
            personalDetails: {
              X000002: cached,
            },
          },
        },
      })
      res = getRes(true)
      await getPersonalDetails(hmppsAuthClient, arnsComponents, mpopComponents)(req, res, nextSpy)
      expect(req.session.data.personalDetails.X000002.tierDetails).toEqual({
        calculation: { provisional: true, tierScore: 'B2' },
        httpStatus: 200,
      })
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
    res = getRes(false, [])
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
    process.env.NODE_ENV = 'development'
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
        data: {
          personalDetails: {
            X000001: mock(),
          },
        },
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
    process.env.NODE_ENV = 'development'
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
        data: {
          personalDetails: {
            X000001: mock(),
          },
        },
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
    process.env.NODE_ENV = 'development'
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
        data: {
          personalDetails: {
            X000001: mock(),
          },
        },
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

describe('/middleware/getPersonalDetails - fetchTierDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call mpopComponents.getTierDetails with the given token and crn', async () => {
    mpopComponents.getTierDetails.mockResolvedValueOnce({
      calculation: { provisional: true, tierScore: 'B2' } as LatestTier,
      httpStatus: 200,
    })
    await fetchTierDetails(mpopComponents, 'X000003', 'system-token')
    expect(mpopComponents.getTierDetails).toHaveBeenCalledTimes(1)
    expect(mpopComponents.getTierDetails).toHaveBeenCalledWith('system-token', 'X000003')
  })

  it('should return the tier details resolved by mpopComponents.getTierDetails', async () => {
    const tierResponse: LatestTierResponse = {
      calculation: { provisional: true, tierScore: 'A1' } as LatestTier,
      httpStatus: 200,
    }
    mpopComponents.getTierDetails.mockResolvedValueOnce(tierResponse)
    const result = await fetchTierDetails(mpopComponents, 'X000003', 'system-token')
    expect(result).toEqual(tierResponse)
  })

  it('should return undefined when mpopComponents.getTierDetails resolves with undefined', async () => {
    mpopComponents.getTierDetails.mockResolvedValueOnce(undefined)
    const result = await fetchTierDetails(mpopComponents, 'X000003', 'system-token')
    expect(result).toBeUndefined()
  })

  it('should propagate errors thrown by mpopComponents.getTierDetails', async () => {
    const error = new Error('upstream tier failure')
    mpopComponents.getTierDetails.mockRejectedValueOnce(error)
    await expect(fetchTierDetails(mpopComponents, 'X000003', 'system-token')).rejects.toThrow('upstream tier failure')
  })
})
