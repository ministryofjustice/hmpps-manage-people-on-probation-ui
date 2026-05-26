import { HmppsAuthClient } from '../../data'
import { SentenceCompliance } from '../../data/model/compliance'
import { BreachWarning } from '../../models/Locals'
import { getBreach } from './getBreach'

const mockGetSystemClientToken = jest.fn()

jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => ({
    getSystemClientToken: mockGetSystemClientToken,
  }))
})

const mockGetPersonCompliance = jest.fn()

jest.mock('../../data/masApiClient', () => {
  return jest.fn().mockImplementation(() => ({
    getPersonCompliance: mockGetPersonCompliance,
  }))
})

const username = 'user-1'
const crn = 'X000001'
const id = 'contact-1'
const selectedSentenceId = 1

const mockBreachSentenceCompliance: SentenceCompliance = {
  eventNumber: '1',
  activeBreach: { startDate: '2024-01-01', status: 'BREACH_INITIATED' },
} as unknown as SentenceCompliance

const hmppsAuthClient = new HmppsAuthClient(null)

const buildReq = () => ({
  session: {
    data: {
      appointments: { [crn]: { [id]: { eventId: selectedSentenceId } } },
      sentences: { [crn]: [{ id: selectedSentenceId, eventNumber: '1', order: { description: 'Community Order' } }] },
    },
  },
})

const buildRes = () => ({
  locals: {
    appointmentOutcome: { crn, id, breachWarning: null as BreachWarning | null },
    user: { username },
    flags: { enableNonCompliance: true },
  },
})

describe('/middleware/appointment-outcomes/getBreach', () => {
  let req: ReturnType<typeof buildReq>
  let res: ReturnType<typeof buildRes>
  let next: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSystemClientToken.mockResolvedValue('token-1')
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [] })
    req = buildReq()
    res = buildRes()
    next = jest.fn()
  })

  it('should set breach to matching SentenceCompliance when sentence ID matches and has an active breach with matching event number', async () => {
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [mockBreachSentenceCompliance] })

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toEqual({ order: 'Community Order', breachDate: '2024-01-01' })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when no sentence matches the selected sentence id', async () => {
    req.session.data.sentences[crn] = [{ id: 999, eventNumber: '1', order: { description: 'Community Order' } }]
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [mockBreachSentenceCompliance] })

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but the current sentence has no active breach', async () => {
    mockGetPersonCompliance.mockResolvedValue({ currentSentences: [{ eventNumber: '1' }] })

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but event numbers do not match', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      currentSentences: [{ ...mockBreachSentenceCompliance, eventNumber: '99' }],
    })

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  describe('when the else branch is hit (no API calls made)', () => {
    afterEach(() => {
      expect(mockGetPersonCompliance).not.toHaveBeenCalled()
      expect(mockGetSystemClientToken).not.toHaveBeenCalled()
    })

    it('should set breach to null when selectedSentence is not a finite number', async () => {
      req.session.data.appointments[crn][id].eventId = 'not-a-number' as any

      await getBreach(hmppsAuthClient)(req as any, res as any, next)

      expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should set breach to null when sentences are not in session', async () => {
      delete (req.session.data.sentences as any)[crn]

      await getBreach(hmppsAuthClient)(req as any, res as any, next)

      expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  it('should call getPersonCompliance with the correct crn', async () => {
    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(mockGetPersonCompliance).toHaveBeenCalledWith(crn)
  })

  it('should call getSystemClientToken with the correct username', async () => {
    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(mockGetSystemClientToken).toHaveBeenCalledWith(username)
  })

  it('should set breach to null and still call next when getPersonCompliance rejects', async () => {
    mockGetPersonCompliance.mockRejectedValue(new Error('API error'))

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null and still call next when getSystemClientToken rejects', async () => {
    mockGetSystemClientToken.mockRejectedValue(new Error('Auth error'))

    await getBreach(hmppsAuthClient)(req as any, res as any, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })
})
