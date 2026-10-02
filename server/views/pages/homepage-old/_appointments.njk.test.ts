import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const render = (input: Record<string, unknown>) => {
  const env = createNunjucksTestEnv()
  return env.render('pages/homepage-old/_appointments.njk', input)
}

describe('pages/homepage-old/_appointments.njk', () => {
  it('renders the feature disabled message when disableUserAppointments is set', () => {
    const html = render({ appointments: [], disableUserAppointments: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="appointmentsFeatureDisabled"]').text()).toContain(
      'Appointments and outcomes are not currently available. You can view them on NDelius.',
    )
    expect($('[data-qa="appointmentsTimeoutError"]').length).toBe(0)
  })

  it('renders the timeout error message when appointmentsTimeoutError is set and disableUserAppointments is not', () => {
    const html = render({ appointments: [], appointmentsTimeoutError: true })
    const $ = cheerio.load(html)

    expect($('[data-qa="appointmentsTimeoutError"]').text()).toContain(
      'Upcoming appointments are currently unavailable.',
    )
    expect($('[data-qa="appointmentsFeatureDisabled"]').length).toBe(0)
  })

  it('renders the no appointments message when neither flag nor timeout error is set', () => {
    const html = render({ appointments: [] })
    const $ = cheerio.load(html)

    expect(html).toContain('There are no upcoming appointments.')
    expect($('[data-qa="appointmentsFeatureDisabled"]').length).toBe(0)
    expect($('[data-qa="appointmentsTimeoutError"]').length).toBe(0)
  })
})
