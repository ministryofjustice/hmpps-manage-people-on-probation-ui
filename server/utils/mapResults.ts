import { ProbationSearchResponse } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { DateTime } from 'luxon'
import { ProbationSearchRequest } from '../data/model/search'

export function mapResults(response: ProbationSearchResponse, request: ProbationSearchRequest) {
  const returnedProviders =
    response.probationAreaAggregations?.map(p => ({
      value: `${p.code}-${p.description}`,
      text: `${p.description} (${p.count})`,
      checked: request.providersFilter?.includes(`${p.code}-${p.description}`),
    })) ?? []
  const selectedProviders =
    request.providersFilter
      ?.filter(p => !returnedProviders.find(r => r.value === p))
      .map(p => ({
        value: p,
        text: `${p.substring(4)} (0)`,
        checked: true,
      })) ?? []
  return {
    content: response.content?.map(result => {
      const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
      return {
        ...result,
        formattedDateOfBirth: result.dateOfBirth ? DateTime.fromISO(result.dateOfBirth).toFormat('dd/MM/yyyy') : '',
        imageUrl: result.otherIds?.nomsNumber
          ? `/search/prisoner-image/${result.otherIds?.nomsNumber}`
          : '/assets/images/NoPhoto@2x.png',
        officer: `${activeManager?.staff?.surname}, ${activeManager?.staff?.forenames}`,
        provider: activeManager?.probationArea?.description,
      }
    }),
    query: request.query,
    providers: [...selectedProviders, ...returnedProviders].sort(
      (a, b) => +b.checked - +a.checked || a.text?.localeCompare(b.text),
    ),
    matchAllTerms: request.matchAllTerms,
  }
}
