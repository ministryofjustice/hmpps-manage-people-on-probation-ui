import crypto from 'crypto'
import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import config from '../config'
import { AppResponse } from '../models/Locals'
import validateHost from './validateHost'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use(validateHost())
  router.use((_req: Request, res: AppResponse, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })
  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'js.monitor.azure.com', '*.applicationinsights.azure.com/v2/track'],
          // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
          // <script nonce="{{ cspNonce }}">
          // or
          // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
          // This ensures only scripts we trust are loaded, and not anything injected into the
          // page by an attacker.
          scriptSrc: [
            "'self' https://browser.sentry-cdn.com https://js.sentry-cdn.com",
            'js.monitor.azure.com',
            '*.applicationinsights.azure.com/v2/track',
            (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
          ],
          connectSrc: [
            "'self' https://*.sentry.io",
            'js.monitor.azure.com',
            '*.applicationinsights.azure.com/v2/track',
          ],
          workerSrc: ["'self' blob:"],
          styleSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          fontSrc: ["'self'"],
          formAction: [`'self' ${config.apis.hmppsAuth.externalUrl}`],
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
