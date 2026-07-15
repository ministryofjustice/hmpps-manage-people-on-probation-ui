import { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'
import { Route } from '../@types'
import config from '../config'

// Flags that hand a check-in journey over to the manage online check-ins service.
// Add each new de-integration flag here as well as to FeatureFlags.
export type NewCheckInServiceFlag = 'enableESUPCheckinNewReview'

const stripTrailingSlash = (url: string): string => url.replace(/\/$/, '')

// `back` arrives as a site-relative path, so it has to be made absolute before it is
// handed to the manage online check-ins service on a separate domain.
const absoluteBackUrl = (back: unknown): string | null => {
  if (typeof back !== 'string' || !back.startsWith('/') || back.startsWith('//')) {
    return null
  }
  return `${stripTrailingSlash(config.domain)}${back}`
}

// The manage online check-ins service mirrors this service's check-in URLs, so the
// requested path is passed through as-is rather than rebuilt per journey.
export const redirectToManageCheckInService = (flag: NewCheckInServiceFlag): Route<void> => {
  return (req: Request, res: AppResponse, next: NextFunction): void => {
    if (res.locals.flags?.[flag] !== true) {
      return next()
    }
    const [path] = req.originalUrl.split('?')
    const link = `${stripTrailingSlash(config.eSupervisionManageCheckins.link)}${path}`
    const back = absoluteBackUrl(req.query.back)
    return res.redirect(back ? `${link}?back=${encodeURIComponent(back)}` : link)
  }
}
