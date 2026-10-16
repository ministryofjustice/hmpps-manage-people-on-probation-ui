import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('partials/_fallback_prob_fe_header.njk', input)
}

describe('partials/_fallback_prob_fe_header.njk', () => {
  it('renders the dev tag if dev environment', () => {
    const html = render({ environmentName: 'DEV', environmentNameColour: '' })
    const $ = cheerio.load(html)

    expect($('.govuk-tag').text().trim()).toBe('DEV')
  })

  it('renders the preprod tag if pre-production environment', () => {
    const html = render({ environmentName: 'PRE-PRODUCTION', environmentNameColour: 'govuk-tag--green' })
    const $ = cheerio.load(html)

    expect($('.govuk-tag.govuk-tag--green')).toHaveLength(1)
    expect($('.govuk-tag.govuk-tag--green').text().trim()).toBe('PRE-PRODUCTION')
  })

  it('no tag appears if prod environment', () => {
    const html = render({ environmentName: 'PRODUCTION', environmentNameColour: '' })
    const $ = cheerio.load(html)

    expect($('.govuk-tag')).toHaveLength(0)
  })

  it('renders links based on env', () => {
    const html = render({ authUrl: 'https://sign-in-dev.hmpps.service.justice.gov.uk' })
    const $ = cheerio.load(html)

    expect($('a').eq(1).attr('href')).toBe('https://sign-in-dev.hmpps.service.justice.gov.uk/auth/account-details')
    expect($('a').eq(3).attr('href')).toBe('https://sign-in-dev.hmpps.service.justice.gov.uk/auth/account-details')
  })

  it('renders account name correctly', () => {
    const html = render({ user: { displayName: 'John Smith' } })
    const $ = cheerio.load(html)

    expect($('[data-qa="probation-common-header-user-name"]').text().trim()).toBe('J. Smith')
  })
})
