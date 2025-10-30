import type { RequestHandler } from 'express'
import ProbationComponentsService from '../services/ProbationComponentsService'
import logger from '../../logger'

export default function getFrontendComponents(probationComponentsService: ProbationComponentsService): RequestHandler {
  return async (req, res, next) => {
    try {
      // Check if FE components are already cached in the session
      const cached = (req.session as any)?.feComponents
      if (cached?.header && cached?.footer) {
        res.locals.feComponents = cached
        return next()
      }

      // Only fetch components if a user token is available
      const token: string | undefined = res.locals?.user?.token
      if (!token) {
        // skip fetching
        return next()
      }

      // Not cached: fetch from backend and cache in session
      const { header, footer } = await probationComponentsService.getProbationFEComponents(['header', 'footer'], token)
      res.locals.feComponents = {
        header: replaceHashWithSlash(header.html),
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }

      if (req?.session) {
        ;(req.session as any).feComponents = res.locals.feComponents
      }

      return next()
    } catch (error) {
      logger.info(error, 'Failed to fetch probation front end components')
      // will display fallback pages
      return next()
    }
  }
}

function replaceHashWithSlash(source: string | null | undefined): string | null {
  if (source === null || source === undefined) return null
  const input = String(source)
  if (!input.includes('#')) return input
  // Replace attribute values that equal exactly '#', preserving the quote style
  return input.replace(/=(['"])#\1/g, '=$1/$1')
}
