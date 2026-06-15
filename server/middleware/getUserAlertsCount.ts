import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    res.locals.alertsCount = await masClient.getUserAlertsCount()
    return next()
  }
}
