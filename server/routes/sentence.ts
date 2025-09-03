import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'
import { getPersonalDetails } from '../middleware'

export default function sentenceRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/sentence', controllers.sentence.getSentence(hmppsAuthClient))

  get('/case/:crn/sentence/probation-history', controllers.sentence.getProbationHistory(hmppsAuthClient))

  router.get(
    '/case/:crn/sentence/previous-orders',
    getPersonalDetails(hmppsAuthClient),
    controllers.sentence.getPreviousOrders(hmppsAuthClient),
  )

  router.get(
    '/case/:crn/sentence/previous-orders/:eventNumber',
    getPersonalDetails(hmppsAuthClient),
    controllers.sentence.getPreviousOrderDetails(hmppsAuthClient),
  )

  get('/case/:crn/sentence/offences/:eventNumber', controllers.sentence.getOffenceDetails(hmppsAuthClient))

  get(
    '/case/:crn/sentence/probation-history/staff-contacts',
    controllers.personalDetails.getStaffContacts(hmppsAuthClient),
  )

  get(
    '/case/:crn/sentence/licence-condition/:licenceConditionId/note/:noteId',
    controllers.sentence.getLicenceConditionNote(hmppsAuthClient),
  )

  get(
    '/case/:crn/sentence/requirement/:requirementId/note/:noteId',
    controllers.sentence.getRequirementNote(hmppsAuthClient),
  )
}
