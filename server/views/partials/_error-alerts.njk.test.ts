import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  // _error-alerts.njk uses `mojAlert` without importing it itself - it relies on being `{% include %}`d
  // into a template that has already imported it (e.g. layout.njk). Reproduce that here.
  const wrapper = `{% from "moj/components/alert/macro.njk" import mojAlert %}{% include "partials/_error-alerts.njk" %}`
  return env.renderString(wrapper, input)
}

describe('partials/_error-alerts.njk', () => {
  it('renders no error banner when alertsCount has no errors', () => {
    const html = render({ alertsCount: '3' })
    const $ = cheerio.load(html)

    expect($('[data-qa="errors"]')).toHaveLength(0)
  })

  it('renders an error banner with the alertsCount error message when present', () => {
    const html = render({
      alertsCount: { errors: [{ text: 'Alerts are currently unavailable. You can view them on NDelius.' }] },
    })
    const $ = cheerio.load(html)

    expect($('[data-qa="errors"]').text()).toContain('Alerts are currently unavailable. You can view them on NDelius.')
  })
})
