import httpMocks from 'node-mocks-http'
import HmppsAuthClient from '../data/hmppsAuthClient'
import ESupervisionClient from '../data/eSupervisionClient'
import { mockAppResponse } from '../controllers/mocks'
import { getUpcomingCheckinDetails } from './getCheckinUpcomingDetails'
import { LocalsUser } from '../models/Locals'

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.mock('../data/eSupervisionClient')

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const mockGetUpcomingCheckinQuestionItems = jest
  .spyOn(ESupervisionClient.prototype, 'getUpcomingCheckinQuestionItems')
  .mockImplementation(async () => null)

const crn = 'X000001'
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

describe('getUpcomingCheckinDetails', () => {
  let res: ReturnType<typeof mockAppResponse>

  beforeEach(() => {
    jest.clearAllMocks()
    res = mockAppResponse()

    res.locals = {
      ...res.locals,
      user: {
        username: 'user-1',
        authSource: 'test',
        token: '1234',
      },
    }
  })

  it('attaches the upcoming check in details to res.locals', async () => {
    const mockApiResponse = {
      upcoming: {
        expectedCheckinDate: '2026-05-20T10:00:00+01:00',
        items: [] as any,
      },
    }
    mockGetUpcomingCheckinQuestionItems.mockResolvedValue(mockApiResponse)

    const req = httpMocks.createRequest({ params: { crn } })

    await getUpcomingCheckinDetails(hmppsAuthClient)(req, res)

    expect(mockGetUpcomingCheckinQuestionItems).toHaveBeenCalledWith(crn, 'en-GB')
    expect(res.locals.upcomingCheckin).toEqual(mockApiResponse)
  })
})
