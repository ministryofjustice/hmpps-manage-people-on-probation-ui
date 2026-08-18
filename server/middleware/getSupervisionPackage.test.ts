import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getSupervisionPackage } from './getSupervisionPackage'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import { SupervisionPackageResponse } from '../models/SupervisionPackage'
import logger from '../../logger'
import { DateTime } from 'luxon'

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const CRN = 'X000001'
const SYSTEM_TOKEN = 'mock-system-token'

const makeSupervisionPackageResponse = (
  overrides: Partial<SupervisionPackageResponse> = {},
): SupervisionPackageResponse =>
  ({
    currentPhase: { phase: { code: 'STD', description: 'Standard' } },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  }) as SupervisionPackageResponse

const makeSessionEntry = (supervisionPackageResponse?: any): PersonalDetailsSession =>
  ({
    overview: {} as any,
    sentencePlan: {} as any,
    risks: {} as any,
    tierCalculation: {} as any,
    ...(supervisionPackageResponse !== undefined ? { supervisionPackageResponse } : {}),
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

describe('getSupervisionPackage middleware', () => {
  const ORIGINAL_ENV = process.env

  let mpopComponents: jest.Mocked<Pick<MPoPComponents, 'getSupervisionPackageFrontendContext'>>
  let hmppsAuthClient: jest.Mocked<Pick<HmppsAuthClient, 'getSystemClientToken'>>
  let nextSpy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' }
    nextSpy = jest.fn()
    mpopComponents = { getSupervisionPackageFrontendContext: jest.fn() }
    hmppsAuthClient = { getSystemClientToken: jest.fn().mockResolvedValue(SYSTEM_TOKEN) }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('should call next() without fetching when enableSupervisionPackage flag is false', async () => {
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(false)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(mpopComponents.getSupervisionPackageFrontendContext).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should use cached supervisionPackage when already present in session', async () => {
    const cached = makeSupervisionPackageResponse()
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(mpopComponents.getSupervisionPackageFrontendContext).not.toHaveBeenCalled()
    expect(res.locals.supervisionPackageDetails).toEqual(cached)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should fetch and store supervisionPackage in session when not cached', async () => {
    const packageResponse = makeSupervisionPackageResponse()
    mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
    expect(mpopComponents.getSupervisionPackageFrontendContext).toHaveBeenCalledWith(SYSTEM_TOKEN, CRN)
    expect(req.session.data.personalDetails[CRN].supervisionPackageResponse).toEqual(packageResponse)
    expect(res.locals.supervisionPackageDetails).toEqual(packageResponse)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should re-fetch supervisionPackage in development mode even when cached', async () => {
    process.env.NODE_ENV = 'development'
    const cached = makeSupervisionPackageResponse()
    const fresh = makeSupervisionPackageResponse({ createdAt: '2024-02-01' })
    mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(fresh)
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(mpopComponents.getSupervisionPackageFrontendContext).toHaveBeenCalledTimes(1)
    expect(res.locals.supervisionPackageDetails).toEqual(fresh)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the API returns null', async () => {
    mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(null)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Failed to fetch supervision package for CRN ${CRN}`,
      }),
      'Failed to fetch supervision package from MPoP Components API.',
    )
    expect(res.locals.supervisionPackageDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the API call throws an error', async () => {
    mpopComponents.getSupervisionPackageFrontendContext.mockRejectedValue(new Error('Connection refused'))
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Connection refused' }),
      'Failed to connect to MPoP Components API.',
    )
    expect(res.locals.supervisionPackageDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set supervisionPackage to undefined when the API throws a non-Error object', async () => {
    mpopComponents.getSupervisionPackageFrontendContext.mockRejectedValue('unexpected string error')
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(res.locals.supervisionPackageDetails).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should initialise session personal details for CRN if not already present', async () => {
    const packageResponse = makeSupervisionPackageResponse()
    mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)
    const req = buildReq({})
    const res = buildRes(true)

    await getSupervisionPackage(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(req.session.data.personalDetails[CRN]).toBeDefined()
    expect(req.session.data.personalDetails[CRN].supervisionPackageResponse).toEqual(packageResponse)
    expect(nextSpy).toHaveBeenCalled()
  })

  it('sets finalThirdPrompt when eligibility became effective within the last 7 days (eligible)', async () => {
  const packageResponse = makeSupervisionPackageResponse({
    context: {
      finalThirdEligibility: {
        eligible: true,
        since: DateTime.now().toISO(),
      },
    },
  } as any)

  mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(res.locals.finalThirdPrompt).toEqual({ eligible: true })
  expect(nextSpy).toHaveBeenCalled()
})

it('sets finalThirdPrompt when eligibility became effective within the last 7 days (not eligible)', async () => {
  const packageResponse = makeSupervisionPackageResponse({
    context: {
      finalThirdEligibility: {
        eligible: false,
        since: DateTime.now().toISO(),
      },
    },
  } as any)
  mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(res.locals.finalThirdPrompt).toEqual({ eligible: false })
  expect(nextSpy).toHaveBeenCalled()
})

it('does not set a prompt when the eligibility change is outside the 7-day window', async () => {
  const packageResponse = makeSupervisionPackageResponse({
    context: {
      finalThirdEligibility: {
        eligible: true,
        since: DateTime.now().minus({ days: 10 }).toISO(),
      },
    },
  } as any)
  mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(res.locals.finalThirdPrompt).toBeUndefined()
  expect(nextSpy).toHaveBeenCalled()
})

it('does not set a prompt when finalThirdEligibility is absent', async () => {
  const packageResponse = makeSupervisionPackageResponse({
    context: {},
  } as any)
  mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(res.locals.finalThirdPrompt).toBeUndefined()
  expect(nextSpy).toHaveBeenCalled()
})

it('does not set a prompt when since is absent', async () => {
  const packageResponse = makeSupervisionPackageResponse({
    context: {
      finalThirdEligibility: {
        eligible: true,
      },
    },
  } as any)
  mpopComponents.getSupervisionPackageFrontendContext.mockResolvedValue(packageResponse)

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(res.locals.finalThirdPrompt).toBeUndefined()
  expect(nextSpy).toHaveBeenCalled()
})

it('does not set a prompt and calls next() when the supervision package API call fails', async () => {
  mpopComponents.getSupervisionPackageFrontendContext.mockRejectedValue(new Error('boom'))

  const req = buildReq({ [CRN]: makeSessionEntry() })
  const res = buildRes(true)

  await getSupervisionPackage(
    hmppsAuthClient as unknown as HmppsAuthClient,
    mpopComponents as unknown as MPoPComponents,
  )(req, res, nextSpy)

  expect(logger.error).toHaveBeenCalled()
  expect(res.locals.finalThirdPrompt).toBeUndefined()
  expect(nextSpy).toHaveBeenCalled()
})
})


