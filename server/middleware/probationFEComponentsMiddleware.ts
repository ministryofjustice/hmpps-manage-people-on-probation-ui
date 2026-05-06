import type { RequestHandler } from 'express'
import ProbationComponentsService from '../services/ProbationComponentsService'
import logger from '../../logger'
import config from '../config'

export default function getFrontendComponents(probationComponentsService: ProbationComponentsService): RequestHandler {
  return async (req, res, next) => {
    // Check if FE components are already cached in the session
    const cached = (req.session as any)?.feComponents
    const cachedCookiePolicyStatus = (req.session as any)?.enableMopCookiePolicy
    const cachedPrivacyPolicyStatus = (req.session as any)?.enableMopPrivacyPolicy
    if (
      cached?.header &&
      cached?.footer &&
      res.locals.flags?.enableMopCookiePolicy === cachedCookiePolicyStatus &&
      res.locals.flags?.enableMopPrivacyPolicy === cachedPrivacyPolicyStatus
    ) {
      res.locals.feComponents = cached
      res.locals.enableMopCookiePolicy = req.session?.enableMopCookiePolicy
      res.locals.enableMopPrivacyPolicy = req.session?.enableMopPrivacyPolicy
      return next()
    }

    // Only fetch components if a user token is available
    const token: string | undefined = res.locals?.user?.token
    if (!token) {
      // skip fetching
      return next()
    }
    let header: any
    let footer: any
    try {
      // Not cached: fetch from backend
      ;({ header, footer } = await probationComponentsService.getProbationFEComponents(['header', 'footer'], token))
    } catch (error) {
      logger.info(error, 'Failed to fetch probation front end components')
      // will display fallback pages
      return next()
    }
    res.locals.feComponents = {
      header: replaceHashWithSlash(header?.html),
      footer: updateLinks(
        res.locals.flags?.enableMopPrivacyPolicy,
        res.locals.flags?.enableMopCookiePolicy,
        footer?.html,
      ),
      cssIncludes: [...(header?.css || []), ...(footer?.css || [])],
      jsIncludes: [...(header?.javascript || []), ...(footer?.javascript || [])],
    }
    res.locals.enableMopPrivacyPolicy = res.locals.flags?.enableMopPrivacyPolicy
    res.locals.enableMopCookiePolicy = res.locals.flags?.enableMopCookiePolicy

    if (req?.session) {
      ;(req.session as any).feComponents = res.locals.feComponents
      ;(req.session as any).enableMopCookiePolicy = res.locals.enableMopCookiePolicy
      ;(req.session as any).enableMopPrivacyPolicy = res.locals.enableMopPrivacyPolicy
    }

    return next()
  }
}

function replaceHashWithSlash(source: string | null | undefined): string | null {
  if (source === null || source === undefined) return null
  const input = String(source)
  if (!input.includes('#')) return input
  // Replace attribute values that equal exactly '#', preserving the quote style
  return input.replace(/=(['"])#\1/g, '=$1/$1')
}

export function updateLinks(enableMopPrivacyPolicy: boolean, enableMopCookiePolicy: boolean, input: string): string {
  const policyRegex = enableMopPrivacyPolicy
    ? new RegExp(
        `<a([^>]*?)href=["']${config.apis.probationFrontendComponentsApi.url}/privacy-policy["']([^>]*)>`,
        'gi',
      )
    : /$^/

  const cookieRegex = enableMopCookiePolicy
    ? new RegExp(
        `<a([^>]*?)href=["']${config.apis.probationFrontendComponentsApi.url}/cookies-policy["']([^>]*)>`,
        'gi',
      )
    : /$^/
  return input
    .replace(policyRegex, `<a$1href="/privacy-policy" data-qa="privacyPolicyLink"$2>`)
    .replace(cookieRegex, `<a$1href="/cookies-policy" data-qa="cookiesPolicyLink"$2>`)
}
