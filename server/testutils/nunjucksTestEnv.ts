import nunjucks from 'nunjucks'
import path from 'path'

import {
  addressToList,
  dateWithYear,
  deliusDeepLinkUrl,
  fullName,
  govukTime,
  handleQuotes,
  formatEnforcementActionNote,
  toSentenceCase,
  yearsSince,
} from '../utils'

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
  env.addFilter('formatEnforcementActionNote', formatEnforcementActionNote)

  return env
}
