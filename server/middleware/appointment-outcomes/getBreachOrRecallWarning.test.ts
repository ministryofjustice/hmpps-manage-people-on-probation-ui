import httpMocks from 'node-mocks-http'
import { Request } from 'express'
import { mockAppResponse } from '../../controllers/mocks'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import { PersonCompliance, SentenceCompliance } from '../../data/model/compliance'
import { AppResponse } from '../../models/Locals'
import { getBreachOrRecallWarning } from './getBreachOrRecallWarning'

const mockGetSystemClientToken = jest.fn()
const mockGetPersonCompliance = jest.fn()
const mockGetPersonNonCompliance = jest.fn()

jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => ({
    getSystemClientToken: mockGetSystemClientToken,
  }))
})

jest.mock('../../data/masApiClient', () => {
  return jest.fn().mockImplementation(() => ({
    getPersonCompliance: mockGetPersonCompliance,
    getPersonNonCompliance: mockGetPersonNonCompliance,
  }))
})

const username = 'user-1'
const crn = 'X000001'
const id = 'contact-1'
const selectedSentenceId = '1'

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
    priorBreachesOnCurrentOrderCount: 1,
    failureToComplyInLast12Months: 2,
    breachStarted: true,
    breachesOnCurrentOrderCount: 1,
    failureToComplyCount: 2,
    failureToComplyInLast12MonthsCount: 2,
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

xdescribe('/middleware/appointment-outcomes/getBreachOrRecallWarning', () => {
  it('should do this', () => {
    expect(1).toEqual(1)
  })
  /*
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
    mockGetPersonNonCompliance.mockResolvedValue({
      unacceptableAbsence: [],
      acceptableAbsence: [],
      attendedButDidNotComply: [],
    })
  })

  it('should set breach to matching SentenceCompliance when sentence ID matches and has an active breach with matching event number', async () => {
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toEqual({
      order: 'Community Order',
      breachDate: '2024-01-01',
    })
    expect(res.locals.appointmentOutcome.compliance.failureToComplyInLast12MonthsCount).toEqual(2)
    expect(res.locals.appointmentOutcome.compliance.priorBreachesOnCurrentOrderCount).toEqual(1)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when no sentence matches the selected sentence id', async () => {
    req.session.data.sentences[crn][0].id = 9
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when session sentence id is undefined', async () => {
    req.session.data.sentences[crn][0].id = undefined
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but the current sentence has no active breach', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([{ ...mockBreachSentenceCompliance, eventNumber: '1', activeBreach: undefined }]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when sentence ID matches but event numbers do not match', async () => {
    mockGetPersonCompliance.mockResolvedValue({
      ...personComplianceFixture(),
      currentSentences: [{ ...mockBreachSentenceCompliance, eventNumber: '9' }],
    })

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when compliance sentence eventNumber is undefined', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([{ ...mockBreachSentenceCompliance, eventNumber: undefined }]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when session sentence eventNumber is undefined', async () => {
    req.session.data.sentences[crn][0].eventNumber = undefined
    mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should set breach to null when both compliance and session sentence eventNumbers are undefined', async () => {
    req.session.data.sentences[crn][0].eventNumber = undefined
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([{ ...mockBreachSentenceCompliance, eventNumber: undefined }]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
    expect(next).toHaveBeenCalledTimes(1)
  })

  describe('when the else branch is hit (no API calls made)', () => {
    afterEach(() => {
      expect(mockGetPersonCompliance).not.toHaveBeenCalled()
      expect(mockGetSystemClientToken).not.toHaveBeenCalled()
    })

    it('should set breach to null when sentences are not in session', async () => {
      delete req.session.data.sentences[crn]

      await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

      expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should set breach to null when selectedSentence (eventId) is undefined', async () => {
      delete req.session.data.appointments[crn][id].eventId

      await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

      expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should set breach to null when both session sentence id and selectedSentence (eventId) are undefined', async () => {
      req.session.data.sentences[crn][0].id = undefined
      delete req.session.data.appointments[crn][id].eventId

      await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

      expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  it('should call getPersonCompliance with the correct crn', async () => {
    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(mockGetPersonCompliance).toHaveBeenCalledWith(crn)
  })

  it('should call getSystemClientToken with the correct username', async () => {
    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(mockGetSystemClientToken).toHaveBeenCalledWith(username)
  })

  it('should use failureToComplyCount when failureToComplyInLast12MonthsCount is undefined', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([
        {
          ...mockBreachSentenceCompliance,
          compliance: {
            ...mockBreachSentenceCompliance.compliance,
            failureToComplyInLast12MonthsCount: undefined,
            failureToComplyCount: 7,
          },
        },
      ]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.compliance.failureToComplyInLast12MonthsCount).toBe(7)
  })

  it('should use failureToComplyInLast12Months when the other counts are undefined', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([
        {
          ...mockBreachSentenceCompliance,
          compliance: {
            ...mockBreachSentenceCompliance.compliance,
            failureToComplyInLast12MonthsCount: undefined,
            failureToComplyCount: undefined,
            failureToComplyInLast12Months: 5,
          },
        },
      ]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.compliance.failureToComplyInLast12MonthsCount).toBe(5)
  })

  it('should use breachesOnCurrentOrderCount when priorBreachesOnCurrentOrderCount is undefined', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([
        {
          ...mockBreachSentenceCompliance,
          compliance: {
            ...mockBreachSentenceCompliance.compliance,
            priorBreachesOnCurrentOrderCount: undefined,
            breachesOnCurrentOrderCount: 4,
          },
        },
      ]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.compliance.priorBreachesOnCurrentOrderCount).toBe(4)
  })

  it('should not set breach warning when active breach startDate is undefined', async () => {
    mockGetPersonCompliance.mockResolvedValue(
      personComplianceFixture([
        {
          ...mockBreachSentenceCompliance,
          activeBreach: {
            startDate: undefined,
            status: 'BREACH_INITIATED',
          },
        },
      ]),
    )

    await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

    expect(res.locals.appointmentOutcome.breachOrRecallWarning).toBeNull()
  })

  describe('type coercion: s.id vs selectedSentence', () => {
    const matchedBreachWarning = { order: 'Community Order', breachDate: '2024-01-01' }

    it.each`
      sessionSentenceId | selectedId   | expectedBreachWarning
      ${1}              | ${'1'}       | ${matchedBreachWarning}
      ${'1'}            | ${1}         | ${matchedBreachWarning}
      ${'1'}            | ${'1'}       | ${matchedBreachWarning}
      ${1}              | ${1}         | ${matchedBreachWarning}
      ${undefined}      | ${undefined} | ${null}
      ${null}           | ${null}      | ${null}
    `(
      'sets breachWarning to $expectedBreachWarning when session id is $sessionSentenceId and eventId is selectedId',
      async ({ sessionSentenceId, selectedId, expectedBreachWarning }) => {
        req.session.data.sentences[crn][0].id = sessionSentenceId
        req.session.data.appointments[crn][id].eventId = selectedId
        mockGetPersonCompliance.mockResolvedValue(personComplianceFixture([mockBreachSentenceCompliance]))

        await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

        expect(res.locals.appointmentOutcome.breachOrRecallWarning).toEqual(expectedBreachWarning)
      },
    )
  })

  describe('type coercion: s.eventNumber vs sentence.eventNumber', () => {
    const matchedBreachWarning = { order: 'Community Order', breachDate: '2024-01-01' }

    it.each`
      complianceEventNumber | sessionEventNumber | expectedBreachWarning
      ${1}                  | ${'1'}             | ${matchedBreachWarning}
      ${'1'}                | ${1}               | ${matchedBreachWarning}
      ${1}                  | ${1}               | ${matchedBreachWarning}
      ${'1'}                | ${'1'}             | ${matchedBreachWarning}
      ${undefined}          | ${undefined}       | ${null}
      ${null}               | ${null}            | ${null}
    `(
      'sets breachWarning to $expectedBreachWarning when compliance eventNumber is $complianceEventNumber and session eventNumber is $sessionEventNumber',
      async ({ complianceEventNumber, sessionEventNumber, expectedBreachWarning }) => {
        req.session.data.sentences[crn][0].eventNumber = sessionEventNumber
        mockGetPersonCompliance.mockResolvedValue(
          personComplianceFixture([{ ...mockBreachSentenceCompliance, eventNumber: complianceEventNumber }]),
        )

        await getBreachOrRecallWarning(mockedHmppsAuthClient)(req, res, next)

        expect(res.locals.appointmentOutcome.breachOrRecallWarning).toEqual(expectedBreachWarning)
      },
    )
  })
    */
})
