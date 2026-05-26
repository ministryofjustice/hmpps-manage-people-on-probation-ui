import { HmppsAuthClient } from '../data'
import { Route } from '../@types'
import ESupervisionClient from '../data/eSupervisionClient'
import logger from '../../logger'

export const getUpcomingCheckinDetails = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params as Record<string, string>
    const checkinStatus = res.locals.offenderCheckinsByCRNResponse?.status
    if (checkinStatus !== 'VERIFIED') {
      res.locals.upcomingCheckin = null
      return
    }
    try {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupervisionClient = new ESupervisionClient(token)
      const response = await eSupervisionClient.getUpcomingCheckinQuestions(crn, 'en-GB')
      res.locals.upcomingCheckin = response || null
    } catch {
      logger.info(`No upcoming check in found for CRN ${crn}`)
      res.locals.upcomingCheckin = null
    }
  }
}
