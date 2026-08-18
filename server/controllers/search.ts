import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { HmppsAuthClient } from '../data'
import PrisonApiClient from '../data/prisonApiClient'
import { mapResults } from '../utils/mapResults'

const routes = ['getSearch', 'getPhoto'] as const

const searchController: Controller<typeof routes, void> = {
  getSearch: () => {
    return async function getSearch(req, res) {
      req.session.backLink = '/search'
      await sendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      if (res.locals.flags.enableSearchV2) {
        const config = {
          results: {
            ...res.locals.searchResults,
            response: {
              ...res.locals.searchResults?.response,
              ...(res.locals.searchResponse ? mapResults(res.locals.searchResponse, res.locals.searchRequest) : {}),
            },
          },
        }
        return res.render('pages/search-new', config)
      }
      return res.render('pages/search')
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
        await pipeline(data, res)
      } else {
        res.redirect('/assets/images/NoPhoto@2x.png')
      }
    }
  },
}

export default searchController
