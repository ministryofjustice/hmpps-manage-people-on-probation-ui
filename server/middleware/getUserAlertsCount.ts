import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserAlertsCountInner(req, res, next) {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    if (res.locals.flags.enableAlertsCountApi) {
      const response = await masClient.getUserAlertsCountV2()
      res.locals.alertsCount = response.count < 100 ? response.count.toString() : '99+'
    } else {
      const response = await masClient.getUserAlertsCount()
      if (response.totalResults !== undefined && response.totalResults !== null) {
        res.locals.alertsCount = response.totalResults < 100 ? response.totalResults.toString() : '99+'
      } else {
        res.locals.alertsCount = response as unknown as string
      }
    }

    return next()
  }
}
