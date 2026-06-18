import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const response = await masClient.getUserAlertsCount()
    if (response.totalResults !== undefined && response.totalResults !== null) {
      res.locals.alertsCount = response.totalResults < 100 ? response.totalResults.toString() : '99+'
    } else {
      res.locals.alertsCount = response as unknown as string
    }
    return next()
  }
}
