import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'
import type { Services } from '../services'
import controllers from '../controllers'

export default function footerRoute(router: Router, { hmppsAuthClient }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/privacy-policy', controllers.footer.getPrivacyPolicy(hmppsAuthClient))
  get('/cookies-policy', controllers.footer.getCookiePolicy(hmppsAuthClient))
}
