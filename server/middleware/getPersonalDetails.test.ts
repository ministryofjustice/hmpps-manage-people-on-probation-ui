import httpMocks from 'node-mocks-http'
import { getPersonalDetails } from './getPersonalDetails'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import { toPredictors, toRoshWidget } from '../utils'
import {
  mockTierCalculation,
  mockPredictors,
  mockRisks,
  mockUserCaseload,
  mockAppResponse,
  mockSentencePlans,
} from '../controllers/mocks'
import { UserCaseload } from '../data/model/caseload'
import SentencePlanApiClient from '../data/sentencePlanApiClient'
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
} from '../data/model/personalDetails'
import { Contact } from '../data/model/professionalContact'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/tierApiClient')
jest.mock('../data/arnsApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const getPersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(overview()))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const searchUserCaseloadSpy = jest
  .spyOn(MasApiClient.prototype, 'searchUserCaseload')
  .mockImplementation(() => Promise.resolve(mockUserCaseload))
const getPlanByCrnSpy = jest
  .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
  .mockImplementation(() => Promise.resolve(mockSentencePlans))

const nextSpy = jest.fn()

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

const mock = (crn = 'X000001', lastUpdatedDate = mockSentencePlans[0].lastUpdatedDate): PersonalDetailsSession => ({
  overview: overview(crn),
  sentencePlan: {
    lastUpdatedDate,
    showLink: false,
  },
  risks: mockRisks,
  tierCalculation: mockTierCalculation,
  predictors: mockPredictors,
})

const req = httpMocks.createRequest({
  params: {
    crn: 'X000002',
  },
  session: {
    data: {
      personalDetails: {
        X000001: mock(),
      },
    },
  },
})

const res = {
  locals: {
    user: {
      username: 'user-1',
      roles: ['SENTENCE_PLAN'],
    },
    flags: {
      enableSentencePlan: true,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

describe('/middleware/getPersonalDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should request data from the api if personal details for crn does not exist in the session', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient)(req, res, nextSpy)
    const expected = {
      personalDetails: {
        X000001: mock(),
        X000002: mock('X000002', ''),
      },
    }
    expect(req.session.data).toEqual(expected)
    expect(getPersonalDetailsSpy).toHaveBeenCalledWith(req.params.crn)
    expect(tierCalculationSpy).toHaveBeenCalledWith(req.params.crn)
    expect(risksSpy).toHaveBeenCalledWith(req.params.crn)
    expect(predictorsSpy).toHaveBeenCalledWith(req.params.crn)
    expect(searchUserCaseloadSpy).toHaveBeenCalledWith(res.locals.user.username, '', '', { nameOrCrn: req.params.crn })
    expect(getPlanByCrnSpy).toHaveBeenCalledWith('X000002')
    expect(res.locals.case).toEqual(overview('X000002'))
    expect(res.locals.risksWidget).toEqual(toRoshWidget(mockRisks))
    expect(res.locals.tierCalculation).toEqual(mockTierCalculation)
    expect(res.locals.predictorScores).toEqual(toPredictors(mockPredictors))
    expect(res.locals.headerPersonName).toEqual(`Caroline Wolff`)
    expect(res.locals.headerCRN).toEqual(req.params.crn)
    expect(res.locals.headerDob).toEqual('1979-08-18')
    expect(nextSpy).toHaveBeenCalled()
    getPersonalDetailsSpy.mockRestore()
  })

  it('should not request data from the api if personal details for crn already exist in the session', async () => {
    const mockReq = httpMocks.createRequest({
      params: {
        crn: 'X000002',
      },
      session: {
        data: {
          personalDetails: {
            X000001: mock(),
            X000002: mock('X000002'),
          },
        },
      },
    })
    await getPersonalDetails(hmppsAuthClient)(mockReq, res, nextSpy)
    expect(getPersonalDetailsSpy).not.toHaveBeenCalled()
    expect(risksSpy).not.toHaveBeenCalled()
    expect(tierCalculationSpy).not.toHaveBeenCalled()
    expect(predictorsSpy).not.toHaveBeenCalled()
    expect(searchUserCaseloadSpy).not.toHaveBeenCalled()
    expect(res.locals.case).toEqual(overview('X000002'))
    expect(res.locals.risksWidget).toEqual(toRoshWidget(mockRisks))
    expect(res.locals.tierCalculation).toEqual(mockTierCalculation)
    expect(res.locals.predictorScores).toEqual(toPredictors(mockPredictors))
    expect(res.locals.headerPersonName).toEqual(`Caroline Wolff`)
    expect(res.locals.headerCRN).toEqual(req.params.crn)
    expect(res.locals.headerDob).toEqual('1979-08-18')
    expect(nextSpy).toHaveBeenCalled()
    getPersonalDetailsSpy.mockRestore()
  })

  it('should not request the sentence plan if logged in user does not have SENTENCE_PLAN role', async () => {
    const mockRes = {
      locals: {
        user: {
          username: 'user-1',
          roles: [],
        },
        flags: {
          enableSentencePlan: true,
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient)(req, mockRes, nextSpy)
    expect(getPlanByCrnSpy).not.toHaveBeenCalled()
  })

  it('should set the correct sentence plan local variaibles if sentence plan feature flag is disabled', async () => {
    const mockedRes = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {
        enableSentencePlan: false,
      },
    })

    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient)(req, mockedRes, nextSpy)
    expect(mockedRes.locals.sentencePlan).toStrictEqual({
      showLink: false,
      lastUpdatedDate: '',
    })
  })

  it('should set the correct sentence plan local variables if pop not in caseload', async () => {
    const mockedUserCaseload: UserCaseload = { ...mockUserCaseload, caseload: [] }
    jest
      .spyOn(MasApiClient.prototype, 'searchUserCaseload')
      .mockImplementationOnce(() => Promise.resolve(mockedUserCaseload))
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.sentencePlan).toStrictEqual({
      showLink: false,
      lastUpdatedDate: '',
    })
  })

  it('should set the correct sentence plan local variables if user does not have sentence plan role', async () => {
    const mockedRes = mockAppResponse({
      user: {
        username: 'user-1',
        roles: [],
      },
      flags: {
        enableSentencePlan: true,
      },
    })
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    await getPersonalDetails(hmppsAuthClient)(req, mockedRes, nextSpy)
    expect(mockedRes.locals.sentencePlan).toStrictEqual({
      showLink: false,
      lastUpdatedDate: '',
    })
  })

  it('should set the correct sentence plan local variables if user has sentence plan role, pop has sentence plan and pop in user caseload', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest
      .spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn')
      .mockImplementationOnce(() => Promise.resolve(mockSentencePlans))
    const mockedReq = httpMocks.createRequest({
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
    const mockedRes = mockAppResponse({
      user: {
        username: 'user-1',
        roles: ['SENTENCE_PLAN'],
      },
      flags: {
        enableSentencePlan: true,
      },
    })
    await getPersonalDetails(hmppsAuthClient)(mockedReq, mockedRes, nextSpy)
    expect(mockedRes.locals.sentencePlan).toStrictEqual({
      showLink: false,
      lastUpdatedDate: mockSentencePlans[0].lastUpdatedDate,
    })
  })

  it('should set the correct sentence plan local variables if pop has no sentence plan', async () => {
    jest
      .spyOn(MasApiClient.prototype, 'getPersonalDetails')
      .mockImplementationOnce(() => Promise.resolve(overview('X000002')))
    jest.spyOn(SentencePlanApiClient.prototype, 'getPlanByCrn').mockImplementationOnce(() => Promise.resolve([]))

    const mockedRes = mockAppResponse({
      user: {
        username: 'user-1',
        roles: [],
      },
      flags: {
        enableSentencePlan: true,
      },
    })
    await getPersonalDetails(hmppsAuthClient)(req, mockedRes, nextSpy)
    expect(mockedRes.locals.sentencePlan).toStrictEqual({
      showLink: false,
      lastUpdatedDate: '',
    })
  })
})
