import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { getTierChangePrompt } from './getTierChangePrompt'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TierApiClient, { TierHistoryEntry } from '../data/tierApiClient'
import { AppResponse } from '../models/Locals'
import logger from '../../logger'

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const getTierHistory = jest.fn()
jest.mock('../data/tierApiClient', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ getTierHistory })),
}))

const CRN = 'X000001'
const SYSTEM_TOKEN = 'mock-system-token'

const entry = (tierScore: string, calculationDate: string): TierHistoryEntry => ({
  tierScore,
  calculationId: `calc-${calculationDate}`,
  calculationDate,
  changeReason: 'The supervision status changed',
  provisional: false,
})

const buildReq = () => httpMocks.createRequest({ params: { crn: CRN } })

const buildRes = (enableTierChangePrompt: boolean): AppResponse =>
  ({
    locals: {
      user: { username: 'user-1' },
      flags: { enableTierChangePrompt },
    },
  }) as unknown as AppResponse

describe('getTierChangePrompt middleware', () => {
  let hmppsAuthClient: jest.Mocked<Pick<HmppsAuthClient, 'getSystemClientToken'>>
  let nextSpy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    nextSpy = jest.fn()
    hmppsAuthClient = { getSystemClientToken: jest.fn().mockResolvedValue(SYSTEM_TOKEN) }
  })

  it('calls next() without fetching when the flag is disabled', async () => {
    const res = buildRes(false)

    await getTierChangePrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(TierApiClient).not.toHaveBeenCalled()
    expect(res.locals.tierChangePrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('sets tierChangePrompt when there is a recent tier change', async () => {
    const today = DateTime.now().toISO()
    getTierHistory.mockResolvedValue([entry('A1', today), entry('A2', '2026-01-01T10:00:00')])
    const res = buildRes(true)

    await getTierChangePrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
    expect(getTierHistory).toHaveBeenCalledWith(CRN)
    expect(res.locals.tierChangePrompt).toEqual({
      oldTier: 'A2',
      newTier: 'A1',
      historyHref: 'https://tier-dummy-url/v3/case/X000001',
    })
    expect(nextSpy).toHaveBeenCalled()
  })

  it('does not set a prompt when the most recent change is outside the 7-day window', async () => {
    const tenDaysAgo = DateTime.now().minus({ days: 10 }).toISO()
    getTierHistory.mockResolvedValue([entry('A1', tenDaysAgo), entry('A2', '2026-01-01T10:00:00')])
    const res = buildRes(true)

    await getTierChangePrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.tierChangePrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('does not set a prompt when there is no tier change', async () => {
    const today = DateTime.now().toISO()
    getTierHistory.mockResolvedValue([entry('A2', today), entry('A2', '2026-01-01T10:00:00')])
    const res = buildRes(true)

    await getTierChangePrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(res.locals.tierChangePrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('never throws and calls next() when the API call fails', async () => {
    getTierHistory.mockRejectedValue(new Error('boom'))
    const res = buildRes(true)

    await getTierChangePrompt(hmppsAuthClient as unknown as HmppsAuthClient)(buildReq(), res, nextSpy)

    expect(logger.error).toHaveBeenCalled()
    expect(res.locals.tierChangePrompt).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })
})
