import { Request, NextFunction } from 'express'
import { getConfig } from '../config'
import { defaultName } from '../utils/azureAppInsights'
import { makePageTitle } from '../utils'
import { AppResponse } from '../models/Locals'

const baseController = () => {
  return (req: Request, res: AppResponse, next: NextFunction): void => {
    const config = getConfig()
    res.locals.applicationInsightsConnectionString = config.apis.appInsights.connectionString
    res.locals.applicationInsightsRoleName = defaultName()
    // @ts-expect-error TS ERROR
    const url = req.url.split('/').filter(dir => dir)
    res.locals.home = url.length === 0
    res.locals.cases = url[0] === 'case'
    res.locals.search = url[0] === 'search'
    res.locals.makePageTitle = makePageTitle as any
    return next()
  }
}

export default baseController
