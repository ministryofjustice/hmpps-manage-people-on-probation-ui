import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Services } from '../services'
import type { Route } from '../@types'
import controllers from '../controllers/documents'

export default function documentsRoutes(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  get('/case/:crn/documents', controllers.getDocuments(hmppsAuthClient))
  post('/case/:crn/documents', controllers.getDocuments(hmppsAuthClient))
}
