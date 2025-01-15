import { Request, Response, NextFunction } from 'express'
import config from './config'
import { defaultName } from './utils/azureAppInsights'

const baseController = () => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.locals.applicationInsightsConnectionString = config.apis.appInsights.connectionString
    res.locals.applicationInsightsRoleName = defaultName()
    return next()
  }
}

export default baseController
