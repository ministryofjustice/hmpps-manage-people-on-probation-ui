import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const env = createNunjucksTestEnv()

const setupHref = '/case/X778160/appointments/check-in/eligibility-check'
const manageHref = '/case/X778160/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7'

const eligible = { outcome: 'ELIGIBLE', message: 'This person is eligible for online check ins' }
const ineligible = { outcome: 'INELIGIBLE', message: 'Not eligible' }

const render = (params: Record<string, unknown> = {}) =>
  cheerio.load(
    env.renderString(
      '{% from "_components/online-checkins-card/macro.njk" import appOnlineCheckinsCard %}{{ appOnlineCheckinsCard(params) }}',
      { params: { canAccess: true, eligibility: eligible, setupHref, manageHref, ...params } },
    ),
  )

const verifiedCheckin = { status: 'VERIFIED', firstCheckin: '2025-11-03' }

describe('appOnlineCheckinsCard', () => {
  it('renders the card', () => {
    const $ = render()
    expect($('[data-qa="checkinCard"]').length).toBe(1)
    expect($('[data-qa="checkinCard"]').text()).toContain('Online check ins')
  })

  describe('when check ins are verified', () => {
    it('shows the upcoming check in date and the manage link', () => {
      const $ = render({ checkin: verifiedCheckin, upcomingCheckinDate: '2025-11-10' })
      expect($('[data-qa="nextCheckinDueLabel"]').text()).toBe('Next online check in')
      expect($('[data-qa="nextCheckInValue"]').text()).toBe('10 November 2025')
      expect($('[data-qa="checkinCard"] a').text().trim()).toBe('Manage online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
    })

    it('falls back to the first check in date when there is no upcoming check in', () => {
      const $ = render({ checkin: verifiedCheckin })
      expect($('[data-qa="nextCheckInValue"]').text()).toBe('3 November 2025')
    })
  })

  describe('when check ins have not been set up', () => {
    it.each([
      ['there is no check in', undefined],
      ['the check in status is INITIAL', { status: 'INITIAL' }],
    ])('shows the eligibility message and the set up link when %s', (_, checkin) => {
      const $ = render({ checkin })
      expect($('[data-qa="checkinDueValue"]').text()).toBe(eligible.message)
      expect($('[data-qa="checkinCard"] a').text().trim()).toBe('Set up online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(setupHref)
    })

    it('escapes the eligibility message', () => {
      const $ = render({ eligibility: { outcome: 'ELIGIBLE', message: 'Eligible <b>now</b>' } })
      expect($('[data-qa="checkinDueValue"]').text()).toBe('Eligible <b>now</b>')
      expect($('[data-qa="checkinDueValue"] b').length).toBe(0)
    })
  })

  it('shows check ins stopped and the view details link when check ins are inactive', () => {
    const $ = render({ checkin: { status: 'INACTIVE' } })
    expect($('[data-qa="checkinDueValue"]').text()).toBe('Check ins stopped')
    expect($('[data-qa="checkinCard"] a').text().trim()).toBe('View all online check in details')
    expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
  })

  describe('action link visibility', () => {
    it('hides the link when the user cannot access check ins', () => {
      const $ = render({ canAccess: false })
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })

    it('hides the link when the person is ineligible', () => {
      const $ = render({ eligibility: ineligible })
      expect($('[data-qa="checkinDueValue"]').text()).toBe('Not eligible')
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })

    it('hides the link when there is no eligibility result', () => {
      const $ = render({ eligibility: undefined })
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })
  })
})
