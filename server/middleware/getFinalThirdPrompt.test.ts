import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { getFinalThirdPrompt } from './getFinalThirdPrompt'
import HmppsAuthClient from '../data/hmppsAuthClient'
import SupervisionPackageApiClient from '../data/supervisionPackageApiClient'
import { AppResponse } from '../models/Locals'
import logger from '../../logger'

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const getCurrentPhase = jest.fn()
jest.mock('../data/supervisionPackageApiClient', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getCurrentPhase })),
}))

const CRN = 'X000001'
const SYSTEM_TOKEN = 'mock-system-token'

const buildReq = () => httpMocks.createRequest({ params: { crn: CRN } })

const buildRes = (enableFinalThirdPrompt: boolean): AppResponse =>
  ({
    locals: {
      user: { username: 'user-1' },
      flags: { enableFinalThirdPrompt },
    },
  }) as unknown as AppResponse

describe('getFinalThirdPrompt middleware', () => {
  let hmppsAuthClient: jest.Mocked<Pick<HmppsAuthClient, 'getSystemClientToken'>>
  let nextSpy: jest.Mock

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-29T09:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    nextSpy = jest.fn()
    hmppsAuthClient = { getSystemClientToken: jest.fn().mockResolvedValue(SYSTEM_TOKEN) }
  })

  it('calls next() without fetching when the flag is disabled', async () => {
    const res = buildRes(false)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(SupervisionPackageApiClient).not.toHaveBeenCalled()
    expect(res.locals.finalThirdPrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('sets finalThirdPrompt when eligibility became effective within the last 7 days (eligible)', async () => {
    const today = DateTime.now().toISO()
    getCurrentPhase.mockResolvedValue({ finalThirdEligibility: { eligible: true, since: today } })
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
    expect(getCurrentPhase).toHaveBeenCalledWith(CRN)
    expect(res.locals.finalThirdPrompt).toEqual({ eligible: true })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('sets finalThirdPrompt when eligibility became effective within the last 7 days (not eligible)', async () => {
    const today = DateTime.now().toISO()
    getCurrentPhase.mockResolvedValue({ finalThirdEligibility: { eligible: false, since: today } })
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.finalThirdPrompt).toEqual({ eligible: false })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('does not set a prompt when the eligibility change is outside the 7-day window', async () => {
    const tenDaysAgo = DateTime.now().minus({ days: 10 }).toISO()
    getCurrentPhase.mockResolvedValue({ finalThirdEligibility: { eligible: true, since: tenDaysAgo } })
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.finalThirdPrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('does not set a prompt when finalThirdEligibility is absent', async () => {
    getCurrentPhase.mockResolvedValue({})
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.finalThirdPrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('does not set a prompt when since is absent', async () => {
    getCurrentPhase.mockResolvedValue({ finalThirdEligibility: { eligible: true } })
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.finalThirdPrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('never throws and calls next() when the API call fails', async () => {
    getCurrentPhase.mockRejectedValue(new Error('boom'))
    const res = buildRes(true)

    await getFinalThirdPrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(logger.error).toHaveBeenCalled()
    expect(res.locals.finalThirdPrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })
})
