import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('pages/homepage-old/_myEnforcementActions.njk', input)
}

describe('pages/homepage-old/_myEnforcementActions.njk', () => {
  it('renders the feature disabled message when disableEnforcementContacts is set', () => {
    const html = render({ enforcementActions: [], disableEnforcementContacts: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="enforcementFeatureDisabled"]').text()).toContain(
      'Enforcement actions are currently unavailable.',
    )
    expect($('[data-qa="enforcementTimeoutError"]')).toHaveLength(0)
  })

  it('renders the timeout error message when enforcementTimeoutError is set and disableEnforcementContacts is not', () => {
    const html = render({ enforcementActions: [], enforcementTimeoutError: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="enforcementTimeoutError"]').text()).toContain('Enforcement actions are currently unavailable.')
    expect($('[data-qa="enforcementFeatureDisabled"]')).toHaveLength(0)
  })

  it('renders the no enforcement actions message when neither flag nor timeout error is set', () => {
    const html = render({ enforcementActions: [] })
    const $ = cheerio.load(html)

    expect(html).toContain('There are no enforcement actions to take.')
    expect($('[data-qa="enforcementFeatureDisabled"]')).toHaveLength(0)
    expect($('[data-qa="enforcementTimeoutError"]')).toHaveLength(0)
  })
})
