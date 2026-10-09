import httpMocks from 'node-mocks-http'
import { getPersonRiskFlags } from './getPersonRiskFlags'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import { findReplace, setDataValue, getStaffRisk } from '../utils'
import { PersonRiskFlags, RiskFlag } from '../data/model/risk'
import { mockAppResponse } from '../controllers/mocks'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
    findReplace: jest.fn(),
    getStaffRisk: jest.fn(),
  }
})

const getStaffRiskMock = getStaffRisk as jest.MockedFunction<typeof getStaffRisk>

getStaffRiskMock.mockReturnValue({ id: 1, description: 'Risk to Staff', levelDescription: 'Medium' } as RiskFlag)

const nextSpy = jest.fn()
const crn = 'X000001'

const mockRisks: PersonRiskFlags = {
  personSummary: { name: { forename: '', surname: '' }, crn, dateOfBirth: '' },
  opd: {},
  mappa: {},
  riskFlags: [],
  removedRiskFlags: [],
}

const mockSessionRisks: PersonRiskFlags = {
  ...mockRisks,
  personSummary: { ...mockRisks.personSummary, name: { forename: 'James', surname: 'Morrison' } },
}

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const mockFindReplace = findReplace as jest.MockedFunction<typeof findReplace>

const mockFormattedRisks = {
  ...mockRisks,
  riskFlags: [
    { id: 1, description: 'Risk to Staff', levelDescription: 'Medium', mostRecentReviewDate: '2026-10-01' },
    { id: 2, description: 'High ROSH', levelDescription: 'High', mostRecentReviewDate: '2026-10-01' },
  ],
  removedRiskFlags: [{ id: 2, description: 'Removed ROSH flag' }],
} as Partial<PersonRiskFlags>

mockFindReplace.mockImplementation(() => mockFormattedRisks)

const getPersonRiskFlagsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonRiskFlags')
  .mockImplementation(() => Promise.resolve(mockRisks))

const createResponse = ({ enableNDeliusRosh = false } = {}) =>
  mockAppResponse({
    flags: {
      enableNDeliusRosh,
    },
  })

const res = createResponse()

const hmppsAuthClient = new HmppsAuthClient(tokenStore)
describe('middleware/getPersonRiskFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('risks session does not exist for current crn', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })
    beforeEach(async () => {
      await getPersonRiskFlags(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should request the risk flags from the api', async () => {
      expect(getPersonRiskFlagsSpy).toHaveBeenCalledWith(crn)
    })
    it(`should find and replace RoSH with ROSH in the api response`, () => {
      expect(mockFindReplace).toHaveBeenCalledTimes(2)
      expect(mockFindReplace).toHaveBeenNthCalledWith(1, {
        data: mockRisks,
        path: ['riskFlags'],
        key: 'description',
        find: 'RoSH',
        replace: 'ROSH',
      })
      expect(mockFindReplace).toHaveBeenNthCalledWith(2, {
        data: expect.any(Object),
        path: ['removedRiskFlags'],
        key: 'description',
        find: 'RoSH',
        replace: 'ROSH',
      })
      expect(res.locals.personRisks).toEqual(mockFormattedRisks)
    })
    it('should add the response to to req.session.data.risks', () => {
      expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['risks', crn], mockFormattedRisks)
    })
    it('should set res.locals.personRisks to the api response', () => {
      expect(res.locals.personRisks).toEqual(mockFormattedRisks)
      expect(res.locals.rosh).toBeUndefined()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('risks session exists for current crn', () => {
    const mockRiskBadgeData = {
      remainingCount: 0,
    }

    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {
          risks: {
            [crn]: mockSessionRisks,
          },
          riskBadgeData: {
            [crn]: mockRiskBadgeData,
          },
        },
      },
    })

    beforeEach(async () => {
      jest.clearAllMocks()

      await getPersonRiskFlags(hmppsAuthClient)(req, res, nextSpy)
    })

    it('should not request the risk flags from the api', () => {
      expect(getPersonRiskFlagsSpy).not.toHaveBeenCalled()
    })

    it('should not set the risks session', () => {
      expect(mockSetDataValue).not.toHaveBeenCalled()
    })

    it('should set res.locals.personRisks to the session value', () => {
      expect(res.locals.personRisks).toEqual(mockSessionRisks)
    })

    it('should set res.locals.riskToStaff to the expected value', () => {
      expect(res.locals.riskToStaff).toStrictEqual({
        id: 1,
        level: 'MEDIUM',
      })
    })

    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('Risk to staff level value is formatted as VERY HIGH', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })
    beforeEach(async () => {
      getStaffRiskMock.mockImplementationOnce(
        () => ({ id: 1, description: 'Risk to Staff', levelDescription: 'VERY HIGH' }) as RiskFlag,
      )
      await getPersonRiskFlags(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should set res.locals.riskToStaff level to VERY_HIGH', () => {
      expect(res.locals.riskToStaff).toStrictEqual({ id: 1, level: 'VERY_HIGH' })
    })
  })

  it('should not generate risk badge data when risk flags are not present', async () => {
    getPersonRiskFlagsSpy.mockResolvedValueOnce({
      ...mockRisks,
      riskFlags: undefined,
    } as PersonRiskFlags)

    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })

    await getPersonRiskFlags(hmppsAuthClient)(req, res, nextSpy)

    expect(res.locals.riskBadgeData).toBeUndefined()

    expect(mockSetDataValue).toHaveBeenCalledWith(req.session.data, ['riskBadgeData', crn], undefined)
  })

  it('should assign NDelius Rosh values to res.locals.rosh if enableNDeliusRosh feature flag is enabled', async () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })
    const mockRes = createResponse({ enableNDeliusRosh: true })
    await getPersonRiskFlags(hmppsAuthClient)(req, mockRes, nextSpy)
    expect(mockRes.locals.rosh).toEqual({ level: 'HIGH', assessedOn: '2026-10-01' })
  })

  it('should assign a VERY HIGH level to res.locals.rosh when the matching risk flag description is Very High ROSH', async () => {
    const veryHighRisks = {
      ...mockFormattedRisks,
      riskFlags: [
        { id: 1, description: 'Very High ROSH', levelDescription: 'High', mostRecentReviewDate: '2026-10-01' },
      ],
    }
    mockFindReplace.mockImplementationOnce(() => veryHighRisks).mockImplementationOnce(() => veryHighRisks)
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })
    const mockRes = createResponse({ enableNDeliusRosh: true })
    await getPersonRiskFlags(hmppsAuthClient)(req, mockRes, nextSpy)
    expect(mockRes.locals.rosh).toEqual({ level: 'VERY HIGH', assessedOn: '2026-10-01' })
  })

  it('should not throw and should set res.locals.rosh.level to undefined when enableNDeliusRosh is enabled and riskFlags is absent', async () => {
    getPersonRiskFlagsSpy.mockResolvedValueOnce({
      ...mockRisks,
      riskFlags: undefined,
    } as PersonRiskFlags)
    mockFindReplace.mockImplementation(data => data as Partial<PersonRiskFlags>)
    const req = httpMocks.createRequest({
      params: {
        crn,
      },
      session: {
        data: {},
      },
    })
    const mockRes = createResponse({ enableNDeliusRosh: true })
    await expect(getPersonRiskFlags(hmppsAuthClient)(req, mockRes, nextSpy)).resolves.not.toThrow()
    expect(mockRes.locals.rosh).toEqual({ level: null, assessedOn: null })
  })
})
