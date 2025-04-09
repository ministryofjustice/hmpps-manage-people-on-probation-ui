import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers'

export default function sentenceRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/case/:crn/sentence', controllers.sentence.getSentence(hmppsAuthClient))

  get('/case/:crn/sentence/probation-history', controllers.sentence.getProbationHistory(hmppsAuthClient))

  get('/case/:crn/sentence/previous-orders', controllers.sentence.getPreviousOrders(hmppsAuthClient))

  get('/case/:crn/sentence/previous-orders/:eventNumber', controllers.sentence.getPreviousOrderDetails(hmppsAuthClient))

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
