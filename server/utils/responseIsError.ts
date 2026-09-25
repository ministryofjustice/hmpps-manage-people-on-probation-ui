import { ErrorSummary, ErrorSummaryItem } from '../data/model/common'

export interface RestClientError {
  errors: ErrorSummaryItem[]
}

export const responseIsError = <TResponse>(
  response: TResponse | RestClientError | null,
): response is RestClientError | null => {
  return response === null || 'errors' in (response as RestClientError)
}

export const responseIsErrorSummary = <TResponse>(
  response: TResponse | ErrorSummary | null,
): response is ErrorSummary => {
  if (!response) return false
  return 'errors' in (response as ErrorSummary)
}
