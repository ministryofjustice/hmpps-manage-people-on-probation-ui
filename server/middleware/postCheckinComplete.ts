import { HmppsAuthClient } from '../data'
import { Route } from '../@types'

import ESupervisionClient from '../data/eSupervisionClient'
import logger from '../../logger'

export const postCheckinInComplete = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res) => {
    const { id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    await eSupervisionClient.postOffenderSetupComplete(id)
    logger.info('Checkin Registration completed successfully.')
  }
}
