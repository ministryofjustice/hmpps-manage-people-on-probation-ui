import { type Router } from 'express'
import { type Services, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import asyncMiddleware from '../middleware/asyncMiddleware'
import controllers from '../controllers/documents'

export default function documentsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/documents', controllers.getDocuments(hmppsAuthClient))
  post('/case/:crn/documents', controllers.getDocuments(hmppsAuthClient))
}
