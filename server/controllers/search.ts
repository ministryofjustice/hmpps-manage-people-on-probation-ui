import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Controller } from '../@types'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import { HmppsAuthClient } from '../data'
import PersonRecordApiClient from '../data/personRecordApiClient'
import { mapResults } from '../utils/mapResults'
import ESupervisionClient from '../data/eSupervisionClient'

const searchController: Controller<readonly ['getSearch', 'getPhoto'], void> = {
  getSearch: (hmppsAuthClient: HmppsAuthClient) => {
    return async function getSearch(req, res) {
      req.session.backLink = '/search'
      await sendAuditMessage(res, 'VIEW_MAS_SEARCH', res.locals.user.username, SubjectType.USER)
      if (res.locals.flags.enableSearchV2) {
        const token = await hmppsAuthClient.getSystemClientToken(req.user.username)
        const onlineCheckInsClient = new ESupervisionClient(token)
        const config = {
          results: {
            ...res.locals.searchResults,
            response: {
              ...res.locals.searchResults?.response,
              ...(res.locals.searchResponse
                ? await mapResults(res.locals.searchResponse, res.locals.searchRequest, onlineCheckInsClient)
                : {}),
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
      if (req.params.prisonerId && res.locals.flags?.enableSearchV2) {
        data = await new PersonRecordApiClient(token).getImageData(req.params.prisonerId as string)
      }

      if (data) {
        res.set('Cache-Control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        await pipeline(Readable.from(data), res)
      } else {
        res.redirect('/assets/images/NoPhoto@2x.png')
      }
    }
  },
}

export default searchController
