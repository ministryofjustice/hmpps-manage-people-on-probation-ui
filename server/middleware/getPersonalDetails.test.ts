import httpMocks from 'node-mocks-http'
import { getPersonalDetails } from './getPersonalDetails'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import { toPredictors, toRoshWidget } from '../utils'
import { mockTierCalculation, mockPredictors, mockRisks } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/tierApiClient')
jest.mock('../data/arnsApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const getPersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(mock('X000002')))
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

const mock = (crn = 'X000001') =>
  ({
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn,
    dateOfBirth: '1979-08-18',
  }) as any

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const nextSpy = jest.fn()

describe('/middleware/getPersonalDetails', () => {
  it('should request data from the api if personal details for crn does not exist in the session', async () => {
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
    await getPersonalDetails(hmppsAuthClient)(req, res, nextSpy)
    const expected = {
      personalDetails: {
        X000001: mock(),
        X000002: mock('X000002'),
      },
    }
    expect(req.session.data).toEqual(expected)
    expect(getPersonalDetailsSpy).toHaveBeenCalledWith(req.params.crn)
    expect(tierCalculationSpy).toHaveBeenCalledWith(req.params.crn)
    expect(risksSpy).toHaveBeenCalledWith(req.params.crn)
    expect(predictorsSpy).toHaveBeenCalledWith(req.params.crn)
    expect(res.locals.case).toEqual(mock('X000002'))
    expect(res.locals.risksWidget).toEqual(toRoshWidget(mockRisks))
    expect(res.locals.tierCalculation).toEqual(mockTierCalculation)
    expect(res.locals.predictorScores).toEqual(toPredictors(mockPredictors))
    expect(res.locals.headerPersonName).toEqual(`Caroline Wolff`)
    expect(res.locals.headerCRN).toEqual(req.params.crn)
    expect(res.locals.headerDob).toEqual('1979-08-18')
    expect(nextSpy).toHaveBeenCalled()
    getPersonalDetailsSpy.mockRestore()
  })
})
