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
          imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
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
          // Build connect-src dynamically so we can relax it for local development only
          // NOTE: Keep localhost allowances out of non-local environments
          connectSrc: (() => {
            const sources = [
              "'self' https://*.sentry.io",
              'js.monitor.azure.com',
              '*.applicationinsights.azure.com/v2/track',
              'https://probation-frontend-components-dev.hmpps.service.justice.gov.uk',
              // This is required for the S3 bucket to upload checkin images
              // (either have a custom domain or each environment or use the default wild card domain)
              'https://*.s3.eu-west-2.amazonaws.com',
            ]
            // Allow localhost for local development only
            if (config.env === 'local') {
              sources.push('http://localhost:9091')
              sources.push('http://localhost:3000')
            }
            return sources
          })(),
          workerSrc: ["'self' blob:"],
          styleSrc: ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`],
          fontSrc: ["'self'", 'https://probation-frontend-components-dev.hmpps.service.justice.gov.uk'],
          formAction: [`'self' ${config.apis.hmppsAuth.externalUrl}`],
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
