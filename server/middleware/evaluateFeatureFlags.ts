import { RequestHandler } from 'express'
import { logger } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import FlagService from '../services/flagService'
import { AppResponse } from '../models/Locals'

export default function evaluateFeatureFlags(flagService: FlagService): RequestHandler {
  return async (_req, res: AppResponse, next) => {
    try {
      const flags = await flagService.getFlags()
      if (flags) {
        res.locals.flags = flags
      } else {
        logger.info('No flags available')
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve flipt feature flags`)
      next(error)
    }
  }
}
