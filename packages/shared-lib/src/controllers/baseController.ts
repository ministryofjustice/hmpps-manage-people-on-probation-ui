import { Request, Response, NextFunction } from 'express'
import config from '../config'
import { defaultName } from '../utils/azureAppInsights'
import { makePageTitle } from '../utils'

const baseController = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.applicationInsightsConnectionString = config.apis.appInsights.connectionString
    res.locals.applicationInsightsRoleName = defaultName()
    const url = req.url.split('/').filter(dir => dir)
    res.locals.home = url.length === 0
    res.locals.cases = url[0] === 'case'
    res.locals.search = url[0] === 'search'
    res.locals.makePageTitle = makePageTitle
    return next()
  }
}

export default baseController
