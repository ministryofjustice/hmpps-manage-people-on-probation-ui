import { NonComplianceHistoryResponse, SentenceCompliance } from '../../data/model/compliance'
import { Compliance } from '../../data/model/overview'

export const buildCompliance = (
  currentSentence: SentenceCompliance,
  nonCompliance: NonComplianceHistoryResponse,
  existingCompliance: Partial<Compliance> = {},
): Compliance => ({
  ...existingCompliance,
  ...currentSentence.compliance,
  failureToComplyInLast12MonthsCount:
    currentSentence.compliance.failureToComplyInLast12MonthsCount ??
    currentSentence.compliance.failureToComplyCount ??
    currentSentence.compliance.failureToComplyInLast12Months,
  priorBreachesOnCurrentOrderCount:
    currentSentence.compliance.priorBreachesOnCurrentOrderCount ??
    currentSentence.compliance.breachesOnCurrentOrderCount,
  acceptableAbsenceCount: currentSentence.activity.acceptableAbsenceCount,
  nonCompliance,
})
