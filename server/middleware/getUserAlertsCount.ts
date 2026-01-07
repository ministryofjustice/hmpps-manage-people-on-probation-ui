import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Services } from '../services'
import { HmppsAuthClient } from '../data'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const response: number = await masClient.getUserAlertsCount()
    res.locals.alertsCount = response < 100 ? response.toString() : '99+'
    return next()
  }
}
