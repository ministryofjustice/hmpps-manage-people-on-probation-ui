import nunjucks from 'nunjucks'
import path from 'path'
import { Request } from 'express-serve-static-core'
import { arnsNunjucksSetup } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { mpopNunjucksSetup } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import {
  addressToList,
  convertToTitleCase,
  dateWithYear,
  decorateFormAttributes,
  deliusDeepLinkUrl,
  fullName,
  govukTime,
  handleQuotes,
  formatEnforcementActionNote,
  toSentenceCase,
  yearsSince,
  makePageTitle,
  dateWithDayAndWithYear,
  dayOfWeek,
  timeFromTo,
  riskLevelLabel,
} from '../utils'
import logger from '../../logger'
import { AppResponse } from '../models/Locals'
import { activityLinkUrl } from '../utils/activityContactLinkUrl'
import { to12HourTimeCompact } from '../utils/to12HourTimeCompact'

export const createNunjucksTestEnv = (req?: Request, res?: AppResponse) => {
  const env = nunjucks.configure(
    [
      path.join(__dirname, '../views'),
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/dist/components',
      'node_modules/@ministryofjustice/frontend',
      'node_modules/@ministryofjustice/frontend/moj/components',
      'node_modules/@ministryofjustice/probation-search-frontend/components',
      'node_modules/@ministryofjustice/hmpps-arns-frontend-components-lib/dist',
      'node_modules/@ministryofjustice/hmpps-mpop-frontend-components-lib/dist',
    ],
    {
      autoescape: true,
      noCache: true,
    },
  )

  env.addGlobal('addressToList', addressToList)
  env.addGlobal('deliusDeepLinkUrl', deliusDeepLinkUrl)
  env.addGlobal('activityLinkUrl', activityLinkUrl)

  env.addFilter('dateWithYear', dateWithYear)
  env.addFilter('dateWithDayAndWithYear', dateWithDayAndWithYear)
  env.addFilter('yearsSince', yearsSince)
  env.addFilter('toSentenceCase', toSentenceCase)
  env.addFilter('fullName', fullName)
  env.addGlobal('riskLevelLabel', riskLevelLabel)
  env.addFilter('govukTime', govukTime)
  env.addFilter('handleQuotes', handleQuotes)
  env.addGlobal('timeFromTo', timeFromTo)
  env.addFilter('decorateFormAttributes', (obj: any, sections?: string[]) => {
    if (!req || !res) {
      logger.warn('decorateFormAttributes called without request context')
      return obj
    }
    return decorateFormAttributes(req, res)(obj, sections)
  })
  env.addFilter('convertToTitleCase', convertToTitleCase)
  env.addFilter('formatEnforcementActionNote', formatEnforcementActionNote)
  env.addFilter('dayOfWeek', dayOfWeek)
  env.addFilter('to12HourTimeCompact', to12HourTimeCompact)
  env.addGlobal('makePageTitle', makePageTitle)
  arnsNunjucksSetup(env)
  mpopNunjucksSetup(env)
  return env
}
