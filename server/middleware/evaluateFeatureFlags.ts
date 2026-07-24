import { RequestHandler } from 'express'
import logger from '../../logger'
import FlagService from '../services/flagService'
import { AppResponse } from '../models/Locals'

export default function evaluateFeatureFlags(flagService: FlagService): RequestHandler {
  return async function evaluateFeatureFlagsInner(req, res: AppResponse, next) {
    try {
      const pduCodes = (res.locals.user.probationDeliveryUnits || []).map(p => p.code)
      const flags = await flagService.getFlags({
        email: res.locals.user.email,
        username: res.locals.user.username,
        pduCodes,
      })
      if (flags) {
        res.locals.flags = flags

        // Temporarily allow overriding the feature flag while testing migration to new Delius endpoints
        if (req.query.enableDeliusClient === 'true') {
          res.locals.flags.enableDeliusClient = true
        } else if (req.query.enableDeliusClient === 'false') {
          res.locals.flags.enableDeliusClient = false
        }
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
