/* eslint-disable import/no-extraneous-dependencies */
import express, { Router } from 'express'
import {
  initSharedLib,
  errorHandler,
  controllers as sharedControllers,
  middleware as sharedMiddleware,
  monitoring,
  sentry,
  type Services,
} from '@ministryofjustice/manage-people-on-probation-shared-lib'
import createError from 'http-errors'
import * as Sentry from '@sentry/node'

// @ts-expect-error Import untyped middleware for cypress coverage
import cypressCoverage from '@cypress/code-coverage/middleware/express'
import nunjucksSetup from './utils/nunjucksSetup'
import routes from './routes'
import config from './config'
import manageAppointmentRoutes from './routes/manageAppointmentRoutes' // <<< remove this for appointment service
import testRoutes from './routes/testRoutes' // <<< remove this for appointment service

initSharedLib(config)
sentry.initSentry()

export default function createApp(services: Services): express.Application {
  const app = express()

  if (process.env.NODE_ENV === 'development') {
    cypressCoverage(app)
  }

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(sharedMiddleware.sentryMiddleware())
  app.use(monitoring.metricsMiddleware)
  app.use(sharedMiddleware.setUpHealthChecks(services.applicationInfo))
  app.use(sharedMiddleware.setUpWebSecurity())
  app.use(sharedMiddleware.setUpWebSession())
  app.use(sharedMiddleware.setUpWebRequestParsing())
  app.use(sharedMiddleware.setUpStaticResources())
  app.use(sharedControllers.baseContoller())
  nunjucksSetup(app, services.applicationInfo, services)
  const apiRouter = Router()
  app.use(testRoutes(apiRouter)) // <<< remove this for appointment service
  app.use(sharedMiddleware.setUpAuthentication())
  app.use(sharedMiddleware.getFrontendComponents(services.probationComponentsApiService))
  app.use(sharedMiddleware.authorisationMiddleware(['ROLE_MANAGE_SUPERVISIONS']))
  app.use(sharedMiddleware.setUpCurrentUser(services))
  app.use(sharedMiddleware.setUpFlags(services))
  const { hmppsAuthClient } = services
  app.use(sharedMiddleware.getUserAlertsCount(hmppsAuthClient))
  app.use(['/case/:crn', '/case/:crn/*path'], sharedMiddleware.limitedAccess(services))
  // Routes that use multer for multipart upload must be registered before csrf executes
  const router = Router()
  app.use(manageAppointmentRoutes(router, services)) // <<< remove this for appointment service
  app.use(sharedMiddleware.setUpCsrf())
  app.use(routes(router, services))

  if (config.sentry.dsn) Sentry.setupExpressErrorHandler(app)
  app.use((_req, _res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
