import httpMocks from 'node-mocks-http'
import { Request } from 'express'
import { mockAppResponse } from '../../controllers/mocks'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import { PersonCompliance, SentenceCompliance } from '../../data/model/compliance'
import { AppResponse } from '../../models/Locals'
import { getBreach } from './getBreach'

const mockGetSystemClientToken = jest.fn()
const mockGetPersonCompliance = jest.fn()

jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => ({
    getSystemClientToken: mockGetSystemClientToken,
  }))
})

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
  activity: {
    unacceptableAbsenceCount: 0,
    attendedButDidNotComplyCount: 0,
    outcomeNotRecordedCount: 0,
    waitingForEvidenceCount: 0,
    rescheduledCount: 0,
    absentCount: 0,
    rescheduledByStaffCount: 0,
    rescheduledByPersonOnProbationCount: 0,
    lettersCount: 0,
    nationalStandardAppointmentsCount: 0,
    compliedAppointmentsCount: 0,
  },
  compliance: {
    currentBreaches: 1,
    priorBreachesOnCurrentOrderCount: 0,
    failureToComplyInLast12Months: 0,
    breachStarted: true,
    breachesOnCurrentOrderCount: 1,
    failureToComplyCount: 0,
  },
  mainOffence: {
    code: 'OFF001',
    description: 'Test offence',
  },
  order: {
    description: 'Community Order',
    startDate: '2023-01-01',
  },
  activeBreach: { startDate: '2024-01-01', status: 'BREACH_INITIATED' },
}

const personComplianceFixture = (currentSentences: SentenceCompliance[] = []): PersonCompliance => ({
  personSummary: {
    name: { forename: 'Test', surname: 'User' },
    crn,
    dateOfBirth: '1990-01-01',
  },
  previousOrders: {
    breaches: 0,
    count: 0,
  },
  currentSentences,
})

const mockedHmppsAuthClient = jest.mocked(new HmppsAuthClient(null))

let req: httpMocks.MockRequest<Request>
let res: AppResponse
let next: jest.Mock

describe('/middleware/appointment-outcomes/getBreach', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    req = httpMocks.createRequest({
      session: {
        data: {
          appointments: { [crn]: { [id]: { eventId: selectedSentenceId } } },
          sentences: {
            [crn]: [{ id: selectedSentenceId, eventNumber: '1', order: { description: 'Community Order' } }],
          },
        },
      },
    })
    res = mockAppResponse({
      appointmentOutcome: { crn, id, breachWarning: null },
      user: { username },
    })
    next = jest.fn()
    mockGetSystemClientToken.mockResolvedValue('token-1')
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture())
  })

  it('should set breach to matching SentenceCompliance when sentence ID matches and has an active breach with matching event number', async () => {
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachWarning).toEqual({ order: 'Community Order', breachDate: '2024-01-01' })
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when no sentence matches the selected sentence id', async () => {
    req.session.data.sentences[crn][0].id = 9
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but the current sentence has no active breach', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([{ ...mockBreachSentenceCompliance, eventNumber: '1', activeBreach: undefined }]),
    )

    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but event numbers do not match', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      ...personComplianceFixture(),
      currentSentences: [{ ...mockBreachSentenceCompliance, eventNumber: '9' }],
    })

    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  describe('when the else branch is hit (no API calls made)', () => {
    afterEach(() => {
      expect(mockGetPersonCompliance).not.toHaveBeenCalled()
      expect(mockGetSystemClientToken).not.toHaveBeenCalled()
    })

    it('should set breach to null when sentences are not in session', async () => {
      delete req.session.data.sentences[crn]

      await getBreach(mockedHmppsAuthClient)(req, res, next)

      expect(res.locals.appointmentOutcome.breachWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  it('should call getPersonCompliance with the correct crn', async () => {
    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(mockGetPersonCompliance).toHaveBeenCalledWith(crn)
  })

  it('should call getSystemClientToken with the correct username', async () => {
    await getBreach(mockedHmppsAuthClient)(req, res, next)

    expect(mockGetSystemClientToken).toHaveBeenCalledWith(username)
  })
})
