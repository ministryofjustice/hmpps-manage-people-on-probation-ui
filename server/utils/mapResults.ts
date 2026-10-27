import { ProbationSearchResponse } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { DateTime } from 'luxon'
import { ProbationSearchRequest } from '../data/model/search'
import ESupervisionClient from '../data/eSupervisionClient'

export async function mapResults(
  response: ProbationSearchResponse,
  request: ProbationSearchRequest,
  onlineCheckInsClient: ESupervisionClient,
  enableESUPCheckInPhotosForSearch: boolean = false,
) {
  const returnedProviders =
    response.probationAreaAggregations?.map(p => ({
      value: `${p.code}-${p.description}`,
      text: `${p.description} (${p.count})`,
      selected: request.providersFilter?.includes(`${p.code}-${p.description}`),
    })) ?? []
  const selectedProviders =
    request.providersFilter
      ?.filter(p => !returnedProviders.some(r => r.value === p))
      .map(p => ({
        value: p,
        text: `${p.substring(4)} (0)`,
        selected: true,
      })) ?? []
  return {
    content: await Promise.all(
      response.content?.map(async result => {
        const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
        let esupervisionDetails
        if (enableESUPCheckInPhotosForSearch) {
          esupervisionDetails = await onlineCheckInsClient.getOffenderCheckinsByCRN(result.otherIds?.crn)
        }
        let imageUrl = '/assets/images/NoPhoto@2x.png'
        if (esupervisionDetails?.photoUrl) {
          imageUrl = esupervisionDetails.photoUrl
        } else if (result.otherIds?.nomsNumber && result.accessDenied !== true) {
          imageUrl = `/search/prisoner-image/${result.otherIds?.nomsNumber}`
        }
        return {
          ...result,
          formattedDateOfBirth: result.dateOfBirth ? DateTime.fromISO(result.dateOfBirth).toFormat('dd/MM/yyyy') : '',
          imageUrl,
          officer: `${activeManager?.staff?.surname}, ${activeManager?.staff?.forenames}`,
          provider: activeManager?.probationArea?.description,
        }
      }),
    ),
    query: request.query,
    providers: [...selectedProviders, ...returnedProviders].sort(
      (a, b) => +b.selected - +a.selected || a.text?.localeCompare(b.text),
    ),
    matchAllTerms: request.matchAllTerms,
  }
}
