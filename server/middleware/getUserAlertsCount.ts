import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { setDataValue } from '../utils'
import config from '../config'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserAlertsCountInner(req, res, next) {
    const makeRequest = async () => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const response = await masClient.getUserAlertsCount()
      if (![undefined, null].includes(response.totalResults)) {
        res.locals.alertsCount = response.totalResults < 100 ? response.totalResults.toString() : '99+'
      } else {
        res.locals.alertsCount = response as unknown as string
      }
    }

    if (res.locals?.flags?.enableAlertsCountCaching) {
      if (req.session?.cache?.alertsCount && DateTime.now().toMillis() <= req.session.cache.alertsCount.expiresAt) {
        res.locals.alertsCount = req.session.cache.alertsCount.value
      } else {
        await makeRequest()
        const expiresAt = DateTime.now().plus({ minutes: config.alertsCountCacheMinutes }).toMillis()
        setDataValue(req.session, ['cache', 'alertsCount'], {
          value: res.locals.alertsCount,
          expiresAt,
        })
      }
    } else {
      await makeRequest()
    }
    return next()
  }
}
