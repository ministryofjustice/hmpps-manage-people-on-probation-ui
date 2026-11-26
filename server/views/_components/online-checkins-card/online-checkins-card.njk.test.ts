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

// govukSummaryList appends the card title to action links as visually hidden text
const visibleLinkText = ($: cheerio.CheerioAPI) =>
  $('[data-qa="checkinCard"] a').clone().find('.govuk-visually-hidden').remove().end().text().trim()

describe('appOnlineCheckinsCard', () => {
  it('renders the card', () => {
    const $ = render()
    expect($('[data-qa="checkinCard"]').length).toBe(1)
    expect($('[data-qa="checkinCard"]').text()).toContain('Online check ins')
  })

  describe('when check ins are verified', () => {
    it('shows the upcoming check in date and the manage link', () => {
      const $ = render({ checkin: verifiedCheckin, upcomingCheckinDate: '2025-11-10' })
      expect($('[data-qa="checkinLabel"]').text()).toBe('Next online check in')
      expect($('[data-qa="checkinValue"]').text()).toBe('10 November 2025')
      expect(visibleLinkText($)).toBe('Manage online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
    })

    it('falls back to the first check in date when there is no upcoming check in', () => {
      const $ = render({ checkin: verifiedCheckin })
      expect($('[data-qa="checkinValue"]').text()).toBe('3 November 2025')
    })

    it('shows a message when there is no scheduled check in', () => {
      const $ = render({ checkin: { status: 'VERIFIED' } })
      expect($('[data-qa="checkinValue"]').text()).toBe('No online check in scheduled')
      expect(visibleLinkText($)).toBe('Manage online check ins')
    })

    describe('when check ins are ad hoc', () => {
      const adHocCheckin = { ...verifiedCheckin, mode: 'AD_HOC' }

      it('shows the upcoming check in date', () => {
        const $ = render({ checkin: adHocCheckin, upcomingCheckinDate: '2025-11-10' })
        expect($('[data-qa="checkinValue"]').text()).toBe('10 November 2025')
      })

      it('does not fall back to the first check in date when there is no upcoming check in', () => {
        const $ = render({ checkin: adHocCheckin })
        expect($('[data-qa="checkinValue"]').text()).toBe('No online check in scheduled')
      })
    })
  })

  describe('when check ins have not been set up', () => {
    it.each([
      ['there is no check in', undefined],
      ['the check in status is INITIAL', { status: 'INITIAL' }],
    ])('shows the eligibility message and the set up link when %s', (_, checkin) => {
      const $ = render({ checkin })
      expect($('[data-qa="checkinValue"]').text()).toBe(eligible.message)
      expect(visibleLinkText($)).toBe('Set up online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(setupHref)
    })

    it('shows a default status and the set up link when eligible with no message', () => {
      const $ = render({ eligibility: { outcome: 'ELIGIBLE', message: null } })
      expect($('[data-qa="checkinValue"]').text()).toBe('Online check ins not set up')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(setupHref)
    })

    it('escapes the eligibility message', () => {
      const $ = render({ eligibility: { outcome: 'ELIGIBLE', message: 'Eligible <b>now</b>' } })
      expect($('[data-qa="checkinValue"]').text()).toBe('Eligible <b>now</b>')
      expect($('[data-qa="checkinValue"] b').length).toBe(0)
    })
  })

  it('shows check ins stopped and the view details link when check ins are inactive', () => {
    const $ = render({ checkin: { status: 'INACTIVE' } })
    expect($('[data-qa="checkinValue"]').text()).toBe('Check ins stopped')
    expect(visibleLinkText($)).toBe('View all online check in details')
    expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
  })

  describe('when check ins are already set up and the person is not eligible', () => {
    it.each([
      ['ineligible', ineligible],
      ['missing', null],
    ])('keeps the next check in date and the manage link when eligibility is %s', (_, eligibility) => {
      const $ = render({ checkin: verifiedCheckin, upcomingCheckinDate: '2025-11-10', eligibility })
      expect($('[data-qa="checkinLabel"]').text()).toBe('Next online check in')
      expect($('[data-qa="checkinValue"]').text()).toBe('10 November 2025')
      expect(visibleLinkText($)).toBe('Manage online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
    })

    it.each([
      ['ineligible', ineligible],
      ['missing', null],
    ])('keeps check ins stopped and the view details link when eligibility is %s', (_, eligibility) => {
      const $ = render({ checkin: { status: 'INACTIVE' }, eligibility })
      expect($('[data-qa="checkinValue"]').text()).toBe('Check ins stopped')
      expect(visibleLinkText($)).toBe('View all online check in details')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(manageHref)
    })

    it('still hides the link when the user cannot access check ins', () => {
      const $ = render({ checkin: verifiedCheckin, eligibility: ineligible, canAccess: false })
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })
  })

  describe('action link visibility', () => {
    it('hides the link when the user cannot access check ins', () => {
      const $ = render({ canAccess: false })
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })

    it('hides the link when the person is ineligible', () => {
      const $ = render({ eligibility: ineligible })
      expect($('[data-qa="checkinValue"]').text()).toBe('Not eligible')
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })

    it('shows the may be eligible message and the set up link when the outcome is unknown', () => {
      const $ = render({
        eligibility: { outcome: 'UNKNOWN', message: 'Joe Bloggs may be eligible for online check ins.' },
      })
      expect($('[data-qa="checkinValue"]').text()).toBe('Joe Bloggs may be eligible for online check ins.')
      expect(visibleLinkText($)).toBe('Set up online check ins')
      expect($('[data-qa="checkinCard"] a').attr('href')).toBe(setupHref)
    })

    it('hides the link and shows a default status when there is no eligibility result', () => {
      const $ = render({ eligibility: null })
      expect($('[data-qa="checkinValue"]').text()).toBe('Online check ins not set up')
      expect($('[data-qa="checkinCard"] a').length).toBe(0)
    })
  })
})
