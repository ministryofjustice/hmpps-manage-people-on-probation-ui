import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import { responseIsErrorSummary, setDataValue } from '../utils'
import config from '../config'
import { ErrorSummary } from '../data/model/common'
import { UserAlerts } from '../models/Alerts'

export const getUserAlertsCount = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserAlertsCountInner(req, res, next) {
    if (res.locals.flags?.enableAlertsCountApi) {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const response = await masClient.getUserAlertsCountV2()
      if (response && 'count' in response && response.count !== undefined && response.count !== null) {
        res.locals.alertsCount = response.count < 100 ? response.count.toString() : '99+'
      } else {
        res.locals.alertsCount = response as unknown as string
      }
      return next()
    }

    const makeRequest = async (): Promise<string | ErrorSummary | null> => {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      let response: UserAlerts | ErrorSummary | null
      let alertsCount: string | ErrorSummary | null
      try {
        response = await masClient.getUserAlertsCount()
        if (responseIsErrorSummary(response)) {
          alertsCount = response
        } else if ([undefined, null].includes(response?.totalResults)) {
          alertsCount = null
        } else {
          alertsCount = response.totalResults < 100 ? response.totalResults.toString() : '99+'
        }
      } catch {
        alertsCount = { errors: [{ text: 'Alerts are currently unavailable. You can view them on NDelius.' }] }
      }
      return alertsCount
    }
    if (res.locals?.flags?.enableAlertsCountCaching) {
      if (
        req.session?.cache?.alertsCount &&
        res?.locals?.alertsCleared?.error !== false &&
        DateTime.now().toMillis() <= req.session.cache.alertsCount.expiresAt
      ) {
        res.locals.alertsCount = req.session.cache.alertsCount.value
      } else {
        if (res.locals?.alertsCleared?.error === false && req?.session?.cache?.alertsCount) {
          delete req.session.cache.alertsCount
        }
        const response = await makeRequest()
        if (response && !responseIsErrorSummary(response)) {
          const expiresAt = DateTime.now().plus({ minutes: config.alertsCountCacheMinutes }).toMillis()
          setDataValue(req.session, ['cache', 'alertsCount'], {
            value: response,
            expiresAt,
          })
        }
        res.locals.alertsCount = response
      }
    } else {
      res.locals.alertsCount = await makeRequest()
    }

    return next()
  }
}
