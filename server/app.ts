/* eslint-disable import/no-extraneous-dependencies */
import express, { Router } from 'express'
import createError from 'http-errors'

import * as Sentry from '@sentry/node'
// @ts-expect-error Import untyped middleware for cypress coverage
import cypressCoverage from '@cypress/code-coverage/middleware/express'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import routes from './routes'
import type { Services } from './services'
import limitedAccess from './middleware/limitedAccessMiddleware'
import config from './config'
import './sentry'
import sentryMiddleware from './middleware/sentryMiddleware'
import setUpFlags from './middleware/setUpFlags'
import baseController from './baseController'
import multipartRoutes from './routes/multipartRoutes'
import { pageHistory, setUpPageHistory } from './middleware/pageHistory'

export default function createApp(services: Services): express.Application {
  const app = express()

  if (process.env.NODE_ENV === 'development') {
    cypressCoverage(app)
  }

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(sentryMiddleware())
  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  app.use(baseController())
  nunjucksSetup(app, services.applicationInfo)

  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_MANAGE_SUPERVISIONS']))
  app.use(setUpCurrentUser(services))
  app.use(setUpFlags(services))
  app.use(pageHistory())
  app.use(['/case/:crn', '/case/:crn/*path'], limitedAccess(services))
  const router = Router()
  // Routes that use multer for multipart upload must be registered before csrf executes
  app.use(multipartRoutes(router, services))
  app.use(setUpCsrf())
  app.use(routes(router, services))

  if (config.sentry.dsn) Sentry.setupExpressErrorHandler(app)
  app.use((_req, _res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
