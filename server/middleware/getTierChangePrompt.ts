import { DateTime } from 'luxon'
import { tierUrlV3 } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import logger from '../../logger'
import { Route } from '../@types'
import { HmppsAuthClient } from '../data'
import TierApiClient from '../data/tierApiClient'
import { getMostRecentTierChange, isTierChangeInWindow } from '../utils/tierChange'
import config from '../config'

export const getTierChangePrompt = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getTierChangePromptInner(req, res, next) {
    if (!res.locals.flags?.enableTierChangePrompt) return next()

    const { crn } = req.params as Record<string, string>

    try {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals?.user?.username)
      const history = await new TierApiClient(token).getTierHistory(crn)

      const change = getMostRecentTierChange(history)
      if (change && isTierChangeInWindow(change.changeDate, DateTime.now(), config.tier.changePromptWindowDays)) {
        res.locals.tierChangePrompt = {
          oldTier: change.oldTier,
          newTier: change.newTier,
          historyHref: tierUrlV3(config.tierUrl.link, crn),
        }
      }
    } catch (err) {
      logger.error(err, `Failed to fetch tier history for CRN ${crn}.`)
    }

    return next()
  }
}
