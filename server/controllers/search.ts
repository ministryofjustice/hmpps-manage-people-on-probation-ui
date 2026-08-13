import { DateTime } from 'luxon'
import { Readable } from 'stream'
import { Controller } from '../@types'
import { ProbationSearchRequest, ProbationSearchResponse } from '../data/model/search'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { HmppsAuthClient } from '../data'
import PrisonApiClient from '../data/prisonApiClient'

const routes = ['getSearch', 'getPhoto'] as const

const searchController: Controller<typeof routes, void> = {
  getSearch: () => {
    return async function getSearch(req, res) {
      req.session.backLink = '/search'
      await sendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      return res.render('pages/search', {
        results: {
          ...res.locals.searchResults,
          response: {
            ...res.locals.searchResults?.response,
            ...(res.locals.searchResponse ? mapResults(res.locals.searchResponse, res.locals.searchRequest) : {}),
          },
        },
      })
    }
  },

  getPhoto: (hmppsAuthClient: HmppsAuthClient) => {
    return async function getPhoto(req, res) {
      let data: Readable
      const token = await hmppsAuthClient.getSystemClientToken(req.user.username)
      if (req.params.prisonerId) {
        data = await new PrisonApiClient(token).getImageData(req.params.prisonerId as string)
      }

      if (data) {
        res.set('Cache-Control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        Readable.from(data).pipe(res)
      } else {
        res.redirect('/assets/images/NoPhoto@2x.png')
      }
    }
  },
}

function mapResults(response: ProbationSearchResponse, request: ProbationSearchRequest) {
  const returnedProviders = response.probationAreaAggregations.map(p => ({
    value: `${p.code}-${p.description}`,
    text: `${p.description} (${p.count})`,
    checked: request.providersFilter.includes(`${p.code}-${p.description}`),
  }))
  const selectedProviders = request.providersFilter
    .filter(p => !returnedProviders.find(r => r.value === p))
    .map(p => ({
      value: p,
      text: `${p.substring(4)} (0)`,
      checked: true,
    }))
  return {
    content: response.content.map(result => {
      const activeManager = result.offenderManagers?.filter(manager => manager.active).shift()
      return {
        ...result,
        formattedDateOfBirth: result.dateOfBirth ? DateTime.fromISO(result.dateOfBirth).toFormat('dd/MM/yyyy') : '',
        imageUrl: result.otherIds.nomsNumber
          ? `/search/prisoner-image/${result.otherIds.nomsNumber}`
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

export default searchController
