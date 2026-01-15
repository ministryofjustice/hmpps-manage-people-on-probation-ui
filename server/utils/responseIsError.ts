import { ErrorSummaryItem } from '../data/model/common'

interface RestClientError {
  errors: ErrorSummaryItem[]
}

export const responseIsError = <TResponse>(
  response: TResponse | RestClientError | null,
): response is RestClientError | null => {
  return response === null || 'errors' in (response as RestClientError)
}
