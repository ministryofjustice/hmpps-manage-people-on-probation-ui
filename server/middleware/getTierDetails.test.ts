import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getTierDetails } from './getTierDetails'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { LatestTier, LatestTierResponse } from '../data/tierApiClient'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import logger from '../../logger'

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const CRN = 'X000001'
const SYSTEM_TOKEN = 'mock-system-token'

const makeTierResponse = (overrides: Partial<LatestTierResponse> = {}): LatestTierResponse => ({
  calculation: {
    tierScore: 'B2',
    calculationId: 'calc-1',
    calculationDate: '2024-01-01T00:00:00',
    changeReason: '',
    provisional: true,
  } as LatestTier,
  httpStatus: 200,
  ...overrides,
})

const makeSessionEntry = (tierDetails?: LatestTierResponse): PersonalDetailsSession =>
  ({
    overview: {} as any,
    sentencePlan: {} as any,
    risks: {} as any,
    tierCalculation: {} as any,
    ...(tierDetails !== undefined ? { tierDetails } : {}),
  }) as PersonalDetailsSession

const buildReq = (sessionPersonalDetails: Record<string, any> = {}) =>
  httpMocks.createRequest({
    params: { crn: CRN },
    session: {
      data: {
        personalDetails: sessionPersonalDetails,
      },
    },
  })

const buildRes = (enableSupervisionPackage: boolean): AppResponse =>
  ({
    locals: {
      user: { username: 'user-1' },
      flags: { enableSupervisionPackage },
    },
  }) as unknown as AppResponse

describe('getTierDetails middleware', () => {
  const ORIGINAL_ENV = process.env

  let mpopComponents: jest.Mocked<Pick<MPoPComponents, 'getTierDetails'>>
  let hmppsAuthClient: jest.Mocked<Pick<HmppsAuthClient, 'getSystemClientToken'>>
  let nextSpy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' }
    nextSpy = jest.fn()
    mpopComponents = { getTierDetails: jest.fn() }
    hmppsAuthClient = { getSystemClientToken: jest.fn().mockResolvedValue(SYSTEM_TOKEN) }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('should call next() without fetching when enableSupervisionPackage flag is false', async () => {
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(false)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should call next() without fetching when mpopComponents is not provided', async () => {
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient)(req, res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should use cached tierDetails when already present in session', async () => {
    const cached = makeTierResponse()
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(mpopComponents.getTierDetails).not.toHaveBeenCalled()
    expect(res.locals.tierDetails).toEqual(cached)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should fetch and store tierDetails in session when not cached', async () => {
    const tierResponse = makeTierResponse()
    mpopComponents.getTierDetails.mockResolvedValue(tierResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
    expect(mpopComponents.getTierDetails).toHaveBeenCalledWith(SYSTEM_TOKEN, CRN)
    expect(req.session.data.personalDetails[CRN].tierDetails).toEqual(tierResponse)
    expect(res.locals.tierDetails).toEqual(tierResponse)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should re-fetch tierDetails in development mode even when cached', async () => {
    process.env.NODE_ENV = 'development'
    const cached = makeTierResponse()
    const fresh = makeTierResponse({
      calculation: { ...cached.calculation, tierScore: 'A1' } as LatestTier,
    })
    mpopComponents.getTierDetails.mockResolvedValue(fresh)
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(mpopComponents.getTierDetails).toHaveBeenCalledTimes(1)
    expect(res.locals.tierDetails).toEqual(fresh)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the API returns a non-200 status', async () => {
    mpopComponents.getTierDetails.mockResolvedValue({ calculation: null, httpStatus: 500 })
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Failed to fetch tier details for CRN ${CRN}. HTTP status: 500`,
      }),
      'Failed to fetch tier details from MPoP Components API.',
    )
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the try/catch catches an error', async () => {
    mpopComponents.getTierDetails.mockRejectedValue(new Error('Connection refused'))
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Connection refused' }),
      'Failed to connect to MPoP Components API.',
    )
    expect(res.locals.tierDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set tierDetails to undefined when the API throws an error', async () => {
    mpopComponents.getTierDetails.mockRejectedValue(new Error('Connection refused'))
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set tierDetails to undefined when the API throws a non-Error object', async () => {
    mpopComponents.getTierDetails.mockRejectedValue('unexpected string error')
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should show tierScore as MISSING and provisional is true', async () => {
    mpopComponents.getTierDetails.mockResolvedValue({
      calculation: {
        tierScore: 'MISSING',
        provisional: true,
        calculationId: '1',
        calculationDate: '',
        changeReason: '',
      } as LatestTier,
      httpStatus: 200,
    })
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails?.calculation?.tierScore).toBe('MISSING')
    expect(res.locals.tierDetails?.calculation?.provisional).toBe(true)
  })

  it('should show tierScore as MISSING and provisional is already false', async () => {
    mpopComponents.getTierDetails.mockResolvedValue({
      calculation: {
        tierScore: 'MISSING',
        provisional: false,
        calculationId: '1',
        calculationDate: '',
        changeReason: '',
      } as LatestTier,
      httpStatus: 200,
    })
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails?.calculation?.tierScore).toBe('MISSING')
    expect(res.locals.tierDetails?.calculation?.provisional).toBe(false)
  })

  it('should show tierScore as B2 when it is not MISSING', async () => {
    const tierResponse = makeTierResponse()
    mpopComponents.getTierDetails.mockResolvedValue(tierResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails?.calculation?.tierScore).toBe('B2')
  })

  it('should set res.locals.tierUrlV3 with the CRN-specific URL', async () => {
    mpopComponents.getTierDetails.mockResolvedValue(makeTierResponse())
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierUrlV3).toBe(`https://tier-dummy-url/v3/case/${CRN}`)
  })

  it('should set res.locals.tierDetails to the fetched tier data', async () => {
    const tierResponse = makeTierResponse()
    mpopComponents.getTierDetails.mockResolvedValue(tierResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getTierDetails(hmppsAuthClient as unknown as HmppsAuthClient, mpopComponents as unknown as MPoPComponents)(
      req,
      res,
      nextSpy,
    )

    expect(res.locals.tierDetails).toEqual(tierResponse)
  })
})
