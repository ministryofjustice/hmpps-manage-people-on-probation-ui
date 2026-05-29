import { buildCompliance } from './buildCompliance'
import { NonComplianceHistoryResponse, SentenceCompliance } from '../../data/model/compliance'

const nonCompliance: NonComplianceHistoryResponse = {
  unacceptableAbsence: [],
  acceptableAbsence: [],
  attendedButDidNotComply: [],
}

const buildSentenceCompliance = (complianceOverrides = {}): SentenceCompliance =>
  ({
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
      priorBreachesOnCurrentOrderCount: 2,
      failureToComplyInLast12MonthsCount: 3,
      failureToComplyInLast12Months: 4,
      breachStarted: true,
      breachesOnCurrentOrderCount: 5,
      failureToComplyCount: 6,
      ...complianceOverrides,
    },
    mainOffence: {
      code: 'OFF001',
      description: 'Test offence',
    },
    order: {
      description: 'Community Order',
      startDate: '2024-01-01',
    },
  }) as SentenceCompliance

describe('buildCompliance', () => {
  it('should build compliance using explicit compliance values', () => {
    const currentSentence = buildSentenceCompliance()

    const result = buildCompliance(currentSentence, nonCompliance)

    expect(result).toEqual({
      ...currentSentence.compliance,
      failureToComplyInLast12MonthsCount: 3,
      priorBreachesOnCurrentOrderCount: 2,
      nonCompliance,
    })
  })

  it('should fallback to failureToComplyCount when failureToComplyInLast12MonthsCount is undefined', () => {
    const currentSentence = buildSentenceCompliance({
      failureToComplyInLast12MonthsCount: undefined,
      failureToComplyCount: 6,
    })

    const result = buildCompliance(currentSentence, nonCompliance)

    expect(result.failureToComplyInLast12MonthsCount).toBe(6)
  })

  it('should fallback to failureToComplyInLast12Months when other counts are undefined', () => {
    const currentSentence = buildSentenceCompliance({
      failureToComplyInLast12MonthsCount: undefined,
      failureToComplyCount: undefined,
      failureToComplyInLast12Months: 9,
    })

    const result = buildCompliance(currentSentence, nonCompliance)

    expect(result.failureToComplyInLast12MonthsCount).toBe(9)
  })

  it('should fallback to breachesOnCurrentOrderCount when priorBreachesOnCurrentOrderCount is undefined', () => {
    const currentSentence = buildSentenceCompliance({
      priorBreachesOnCurrentOrderCount: undefined,
      breachesOnCurrentOrderCount: 7,
    })

    const result = buildCompliance(currentSentence, nonCompliance)

    expect(result.priorBreachesOnCurrentOrderCount).toBe(7)
  })

  it('should merge existing compliance values', () => {
    const currentSentence = buildSentenceCompliance()

    const result = buildCompliance(currentSentence, nonCompliance, {
      nonCompliance: undefined,
    })

    expect(result).toEqual(
      expect.objectContaining({
        currentBreaches: 1,
        failureToComplyCount: 6,
        nonCompliance,
      }),
    )
  })

  it('should override existing values with current sentence compliance values', () => {
    const currentSentence = buildSentenceCompliance({
      currentBreaches: 10,
    })

    const result = buildCompliance(currentSentence, nonCompliance, {
      currentBreaches: 99,
    })

    expect(result.currentBreaches).toBe(10)
  })
})
