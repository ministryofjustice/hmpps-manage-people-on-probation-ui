import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('partials/_user_navigation.njk', input)
}

describe('partials/_user_navigation.njk', () => {
  const user = { username: 'AUSER' }

  it('renders the alerts count badge with the numeric count', () => {
    const html = render({ user, alertsCount: '3' })
    const $ = cheerio.load(html)

    expect($('.moj-primary-navigation__link[href="/alerts"]').text()).toContain('Alerts')
    expect($('.moj-notification-badge [aria-hidden="true"]').text().trim()).toBe('3')
  })

  it('renders "99+" when the count is capped', () => {
    const html = render({ user, alertsCount: '99+' })
    const $ = cheerio.load(html)

    expect($('.moj-notification-badge [aria-hidden="true"]').text().trim()).toBe('99+')
  })

  it('renders an empty badge when alertsCount is null (handled 404)', () => {
    const html = render({ user, alertsCount: null })
    const $ = cheerio.load(html)

    expect($('.moj-notification-badge [aria-hidden="true"]').text().trim()).toBe('')
  })
})
