import ESupervisionClient from '../data/eSupervisionClient'
import { getUpcomingCheckinDetails } from './getUpcomingCheckinDetails'
import logger from '../../logger'

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.mock('../data/eSupervisionClient')

const mockGetUpcomingCheckinQuestions = jest
  .spyOn(ESupervisionClient.prototype, 'getUpcomingCheckinQuestions')
  .mockImplementation(async () => null)

const crn = 'X000001'
const token = 'token-1'

describe('getUpcomingCheckinDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the upcoming check in details', async () => {
    const mockApiResponse = {
      expectedCheckinDate: '2026-05-20T10:00:00+01:00',
      questions: [] as any,
    }

    mockGetUpcomingCheckinQuestions.mockResolvedValue(mockApiResponse)

    const result = await getUpcomingCheckinDetails(token, crn, 'VERIFIED')

    expect(mockGetUpcomingCheckinQuestions).toHaveBeenCalledWith(crn, 'en-GB')
    expect(result).toEqual(mockApiResponse)
  })

  it('returns null and logs info if the API call fails', async () => {
    mockGetUpcomingCheckinQuestions.mockRejectedValue(new Error('API Error'))

    const result = await getUpcomingCheckinDetails(token, crn, 'VERIFIED')

    expect(mockGetUpcomingCheckinQuestions).toHaveBeenCalledWith(crn, 'en-GB')
    expect(result).toBeNull()
    expect(logger.info).toHaveBeenCalledWith(`No upcoming check in found for CRN ${crn}`)
  })

  it('checks status and if it is not VERIFIED it does not call the endpoint and returns null', async () => {
    const result = await getUpcomingCheckinDetails(token, crn, 'INITIAL')

    expect(mockGetUpcomingCheckinQuestions).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })
})
