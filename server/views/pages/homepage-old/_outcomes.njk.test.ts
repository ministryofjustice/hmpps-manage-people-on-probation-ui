import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('pages/homepage-old/_outcomes.njk', input)
}

describe('pages/homepage-old/_outcomes.njk', () => {
  it('renders the feature disabled message when disableUserAppointments is set', () => {
    const html = render({ outcomes: [], disableUserAppointments: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="outcomesFeatureDisabled"]').text()).toContain(
      'Appointments and outcomes are not currently available. You can view them on NDelius.',
    )
    expect($('[data-qa="outcomesTimeoutError"]').length).toBe(0)
  })

  it('renders the timeout error message when appointmentsTimeoutError is set and disableUserAppointments is not', () => {
    const html = render({ outcomes: [], appointmentsTimeoutError: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="outcomesTimeoutError"]').text()).toContain('Outcomes to log are currently unavailable.')
    expect($('[data-qa="outcomesFeatureDisabled"]').length).toBe(0)
  })

  it('renders the no outcomes message when neither flag nor timeout error is set', () => {
    const html = render({ outcomes: [] })
    const $ = cheerio.load(html)

    expect(html).toContain('There are no outcomes to log.')
    expect($('[data-qa="outcomesFeatureDisabled"]').length).toBe(0)
    expect($('[data-qa="outcomesTimeoutError"]').length).toBe(0)
  })
})
