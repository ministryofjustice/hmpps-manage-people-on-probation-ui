import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'
import logger from '../../logger'

export const getUpcomingCheckinDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params as Record<string, string>

    try {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const response = await eSupervisionClient.getUpcomingCheckinQuestionItems(crn, 'en-GB')
      res.locals.upcomingCheckin = response || null
    } catch (error) {
      logger.info(`No upcoming check in found for CRN ${crn}`)
      res.locals.upcomingCheckin = null
    }
  }
}
