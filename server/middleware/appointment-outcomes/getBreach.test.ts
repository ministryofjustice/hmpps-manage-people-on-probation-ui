import { HmppsAuthClient } from '../../data'
import { PersonCompliance, SentenceCompliance } from '../../data/model/compliance'
import { Sentences } from '../../data/model/sentenceDetails'
import { getBreach } from './getBreach'

const mockGetSystemClientToken = jest.fn()

jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => ({
    getSystemClientToken: mockGetSystemClientToken,
  }))
})

const mockGetPersonCompliance = jest.fn()
const mockGetSentences = jest.fn()

jest.mock('../../data/masApiClient', () => {
  return jest.fn().mockImplementation(() => ({
    getPersonCompliance: mockGetPersonCompliance,
    getSentences: mockGetSentences,
  }))
})

const username = 'user-1'
const crn = 'X000001'
const selectedSentenceId = 1

const mockBreachSentenceCompliance: SentenceCompliance = {
  eventNumber: '1',
  activeBreach: { startDate: '2024-01-01', status: 'BREACH_INITIATED' },
} as unknown as SentenceCompliance

const hmppsAuthClient = new HmppsAuthClient(null)

describe('/middleware/appointment-outcomes/getBreach', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSystemClientToken.mockResolvedValue('token-1')
  })

  it('should return matching SentenceCompliance when sentence ID matches and has an active breach with matching event number', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      currentSentences: [mockBreachSentenceCompliance],
    })
    mockGetSentences.mockResolvedValue({
      sentences: [{ id: selectedSentenceId, eventNumber: '1' }],
    })

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toEqual(mockBreachSentenceCompliance)
  })

  it('should return null when no sentence matches the selected sentence id', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      currentSentences: [mockBreachSentenceCompliance],
    })
    mockGetSentences.mockResolvedValue({
      sentences: [{ id: 999, eventNumber: '1' }],
    })

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })

  it('should return null when sentence ID matches but the current sentence has no active breach', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      currentSentences: [{ eventNumber: '1' }],
    })
    mockGetSentences.mockResolvedValue({
      sentences: [{ id: selectedSentenceId, eventNumber: '1' }],
    })

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })

  it('should return null when sentence ID matches but event numbers do not match', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      currentSentences: [{ ...mockBreachSentenceCompliance, eventNumber: '99' }],
    })
    mockGetSentences.mockResolvedValue({
      sentences: [{ id: selectedSentenceId, eventNumber: '1' }],
    })

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })

  it('should call getPersonCompliance and getSentences with the correct crn', async () => {
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [] })
    mockGetSentences.mockResolvedValue({ sentences: [] })

    await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(mockGetPersonCompliance).toHaveBeenCalledWith(crn)
    expect(mockGetSentences).toHaveBeenCalledWith(crn)
  })

  it('should call getSystemClientToken with the correct username', async () => {
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [] })
    mockGetSentences.mockResolvedValue({ sentences: [] })

    await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(mockGetSystemClientToken).toHaveBeenCalledWith(username)
  })

  it('should return null when getPersonCompliance rejects', async () => {
    mockGetPersonCompliance.mockRejectedValue(new Error('API error'))
    mockGetSentences.mockResolvedValue({ sentences: [{ id: selectedSentenceId, eventNumber: '1' }] })

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })

  it('should return null when getSentences rejects', async () => {
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [mockBreachSentenceCompliance] })
    mockGetSentences.mockRejectedValue(new Error('API error'))

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })

  it('should return null when getSystemClientToken rejects', async () => {
    mockGetSystemClientToken.mockRejectedValue(new Error('Auth error'))

    const result = await getBreach(hmppsAuthClient, username, crn, selectedSentenceId)

    expect(result).toBeNull()
  })
})
