import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity } from '../../../data/model/schedule'

interface GroupedActivities {
  date: string
  activities: Partial<Activity>[]
}

const env = createNunjucksTestEnv()

const render = (groupedActivities: GroupedActivities[]): cheerio.CheerioAPI =>
  cheerio.load(env.renderString('{% include "pages/contact-log/_card-view.njk" %}', { groupedActivities }))

const activity = (overrides: Partial<Activity> = {}): Partial<Activity> => ({
  id: '1',
  type: 'Home visit',
  ...overrides,
})

const caption = ($: cheerio.CheerioAPI, index: number): string =>
  $('.app-hmpps-generic-card__caption').eq(index).text().trim()

const title = ($: cheerio.CheerioAPI, index: number): string =>
  $('.govuk-summary-card__title')
    .eq(index)
    .clone()
    .find('.app-hmpps-generic-card__caption')
    .remove()
    .end()
    .text()
    .trim()

describe('Contact log card view', () => {
  it('renders nothing when there are no grouped activities', () => {
    const $ = render([])
    expect($('.govuk-summary-card')).toHaveLength(0)
  })

  it('renders a generic card per activity', () => {
    const $ = render([
      { date: 'Thursday 9 February 2023', activities: [activity({ id: '1' }), activity({ id: '2' })] },
      { date: 'Wednesday 8 February 2023', activities: [activity({ id: '3' })] },
    ])
    expect($('.govuk-summary-card.app-hmpps-generic-card')).toHaveLength(3)
  })

  it('shows the group date as the caption of each card in the group', () => {
    const $ = render([
      { date: 'Thursday 9 February 2023', activities: [activity({ id: '1' }), activity({ id: '2' })] },
      { date: 'Wednesday 8 February 2023', activities: [activity({ id: '3' })] },
    ])
    expect(caption($, 0)).toBe('Thursday 9 February 2023')
    expect(caption($, 1)).toBe('Thursday 9 February 2023')
    expect(caption($, 2)).toBe('Wednesday 8 February 2023')
  })

  it('renders an Add action on each card', () => {
    const $ = render([{ date: 'Thursday 9 February 2023', activities: [activity()] }])
    const link = $('.govuk-summary-card__actions a')
    expect(link.attr('href')).toBe('/add')
    expect(link.clone().find('.govuk-visually-hidden').remove().end().text().trim()).toBe('Add')
  })

  describe('title', () => {
    it('uses the type when there is no description or display name', () => {
      const $ = render([{ date: 'd', activities: [activity({ type: 'home visit' })] }])
      expect(title($, 0)).toBe('Home visit')
    })

    it('prefers the display name over the type', () => {
      const $ = render([{ date: 'd', activities: [activity({ displayName: 'office visit', type: 'home visit' })] }])
      expect(title($, 0)).toBe('Office visit')
    })

    it('prefixes the description to the display name or type', () => {
      const $ = render([
        {
          date: 'd',
          activities: [
            activity({ description: 'Planned', displayName: 'office visit' }),
            activity({ description: 'Planned', type: 'home visit' }),
          ],
        },
      ])
      expect(title($, 0)).toBe('Planned - office visit')
      expect(title($, 1)).toBe('Planned - home visit')
    })

    it('uses only the description for a cancelled check in', () => {
      const $ = render([
        {
          date: 'd',
          activities: [
            activity({
              description: 'Online check in cancelled',
              type: 'Online probation check in',
              isCancelledCheckIn: true,
            }),
          ],
        },
      ])
      expect(title($, 0)).toBe('Online check in cancelled')
    })
  })
})
