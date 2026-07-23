/* eslint-disable import/no-extraneous-dependencies */
import express, { Router } from 'express'
import createError from 'http-errors'

import * as Sentry from '@sentry/node'
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
import setUpSuccessBanner from './middleware/setUpSuccessBanner'
import baseController from './baseController'
import manageAppointmentRoutes from './routes/manageAppointmentRoutes'
import testRoutes from './routes/testRoutes'
import getFrontendComponents from './middleware/probationFEComponentsMiddleware'
import { getUserAlertsCount } from './middleware/getUserAlertsCount'
import requestLogger from './middleware/requestLogger'
import instrumentRouter from './middleware/instrumentRouter'

export default function createApp(services: Services): express.Application {
  const app = express()

  if (process.env.NODE_ENV === 'development') {
    cypressCoverage(app)
    if (process.env.DISABLE_DEV_REQUEST_LOGGING !== 'true') {
      // Must run before ANY app.use()/router.*() calls - including
      // requestLogger() below - so every registered handler (this one
      // included) is captured in the trace, not just ones registered after it.
      instrumentRouter()
      app.use(requestLogger())
    }
  }

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(sentryMiddleware())
  app.use(metricsMiddleware)

  app.use(function setSurveyLinks(req, res, next) {
    res.locals.pageUrl = encodeURI(`https://manage-people-on-probation.hmpps.service.justice.gov.uk${req.url}`) // ignores ENV
    res.locals.feedbackEmail = config.feedbackEmail
    next()
  })

  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())
  app.use(baseController())
  nunjucksSetup(app, services.applicationInfo, services)
  const apiRouter = Router()
  app.use(testRoutes(apiRouter))
  app.use(setUpAuthentication())
  app.use(setUpSuccessBanner())
  app.use(authorisationMiddleware(['ROLE_MANAGE_SUPERVISIONS']))
  app.use(setUpCurrentUser(services))
  app.use(setUpFlags(services))
  app.use(getFrontendComponents(services.probationComponentsApiService))
  const { hmppsAuthClient } = services
  app.use(getUserAlertsCount(hmppsAuthClient))
  app.use(['/case/:crn', '/case/:crn/*path'], limitedAccess(services))
  // Routes that use multer for multipart upload must be registered before csrf executes
  const router = Router()
  app.use(manageAppointmentRoutes(router, services))
  app.use(setUpCsrf())
  app.use(routes(router, services))
  if (config.sentry.dsn) Sentry.setupExpressErrorHandler(app)
  app.use(function PageNotFound(_req, _res, next) {
    return next(createError(404, 'Not found'))
  })
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
