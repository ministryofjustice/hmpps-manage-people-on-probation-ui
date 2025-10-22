import type { RequestHandler } from 'express'
import ProbationComponentsService from '../services/ProbationComponentsService'
import logger from '../../logger'

export default function getFrontendComponents(probationComponentsService: ProbationComponentsService): RequestHandler {
  return async (req, res, next) => {
    try {
      const { header, footer } = await probationComponentsService.getProbationFEComponents(
        ['header', 'footer'],
        res.locals.user.token,
      )
      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }
      return next()
    } catch (error) {
      logger.info(error, 'Failed to fetch probation front end components')
      return next()
    }
  }
}
