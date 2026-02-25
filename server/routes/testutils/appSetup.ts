import express, { Express, Router } from 'express'
import cookieSession from 'cookie-session'
import { NotFound } from 'http-errors'
import { type Services } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import CaseSearchService, {
  CaseSearchOptions,
} from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import * as auth from '../../authentication/auth'
import type { ApplicationInfo } from '../../applicationInfo'
import setUpAuthentication from '../../middleware/setUpAuthentication'
import errorHandler from '../../errorHandler'

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

export const user: Express.User = {
  name: 'FIRST LAST',
  userId: 'id',
  token: 'token',
  username: 'user1',
  displayName: 'First Last',
  active: true,
  activeCaseLoadId: 'MDI',
  authSource: 'NOMIS',
}

export const flashProvider = jest.fn()

function appSetup(services: Services, production: boolean, userSupplier: () => Express.User): Express {
  const app = express()
  app.set('view engine', 'njk')
  nunjucksSetup(app, testAppInfo, services)
  app.use(cookieSession({ keys: [''] }))
  app.use((req, res, next) => {
    req.user = userSupplier()
    req.flash = flashProvider
    res.locals = {
      user: { ...req.user },
    }
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  const router = Router()
  app.use(routes(router, services))
  app.use(setUpAuthentication())
  app.use((_req, _res, next) => next(new NotFound()))
  app.use(errorHandler(production))
  return app
}

export function appWithAllRoutes({
  production = false,
  services = {
    searchService: new CaseSearchService({} as CaseSearchOptions),
  },
  userSupplier = () => user,
}: {
  production?: boolean
  services?: Partial<Services>
  userSupplier?: () => Express.User
}): Express {
  auth.default.authenticationMiddleware = () => (req, res, next) => next()
  return appSetup(services as Services, production, userSupplier)
}
