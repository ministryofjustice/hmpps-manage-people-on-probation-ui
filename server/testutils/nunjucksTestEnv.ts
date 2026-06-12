import nunjucks from 'nunjucks'
import path from 'path'

import { AsyncLocalStorage } from 'async_hooks'
import { ParamsDictionary, Request } from 'express-serve-static-core'
import { ParsedQs } from 'qs'
import {
  addressToList,
  convertToTitleCase,
  dateWithYear,
  decorateFormAttributes,
  deliusDeepLinkUrl,
  fullName,
  govukTime,
  handleQuotes,
  toSentenceCase,
  yearsSince,
} from '../utils'
import logger from '../../logger'
import { AppResponse } from '../models/Locals'

const requestContext = new AsyncLocalStorage<{ req: Request; res: AppResponse }>()

export const createNunjucksTestEnv = () => {
  const env = nunjucks.configure(
    [
      path.join(__dirname, '../views'),
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/dist/components',
      'node_modules/@ministryofjustice/frontend',
      'node_modules/@ministryofjustice/frontend/moj/components',
      'node_modules/@ministryofjustice/probation-search-frontend/components',
      'node_modules/@ministryofjustice/hmpps-arns-frontend-components-lib/dist',
    ],
    {
      autoescape: true,
      noCache: true,
    },
  )

  env.addGlobal('addressToList', addressToList)
  env.addGlobal('deliusDeepLinkUrl', deliusDeepLinkUrl)

  env.addFilter('dateWithYear', dateWithYear)
  env.addFilter('yearsSince', yearsSince)
  env.addFilter('toSentenceCase', toSentenceCase)
  env.addFilter('fullName', fullName)
  env.addFilter('govukTime', govukTime)
  env.addFilter('handleQuotes', handleQuotes)
  env.addFilter('decorateFormAttributes', (obj: any, sections?: string[]) => {
    const ctx = requestContext.getStore()

    // Some render paths (for example tests or non-request rendering) may not
    // have an AsyncLocalStorage context. Fall back to the undecorated object and
    // log for investigation.
    if (!ctx) {
      logger.warn('decorateFormAttributes called without request context')
      return obj
    }

    return decorateFormAttributes(
      ctx.req as unknown as Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
      ctx.res,
    )(obj, sections)
  })
  env.addFilter('convertToTitleCase', convertToTitleCase)

  return env
}
