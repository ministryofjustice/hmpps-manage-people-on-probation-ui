import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'

const context = {
  throughcareRows: [
    { key: { text: 'Prison offender manager (POM)' }, value: { text: 'Rachel Jones' } },
    { key: { text: 'Last prison' }, value: { text: 'Moorland (HMP & YOI)' } },
    { key: { text: 'Release date' }, value: { text: '16 March 2026' } },
  ],
  crn: 'X000001',
  cardClasses: 'app-summary-card--light',
}

const render = () => {
  const env = createNunjucksTestEnv()
  const html = env.render('partials/_overview-throughcare-card.njk', context)
  return cheerio.load(html)
}

const cellText = ($: cheerio.CheerioAPI, selector: string) =>
  $(selector)
    .get()
    .map(el => $(el).text().trim())

describe('partials/_overview-throughcare-card.njk', () => {
  it('renders the card title, classes and a link to the contacts page', () => {
    const $ = render()
    const card = $('[data-qa="throughcareCard"]')

    expect(card.hasClass('app-summary-card--light')).toBe(true)
    expect(card.find('h3.app-summary-card__title').text().trim()).toBe('Throughcare information')

    const link = card.find('.app-summary-card__actions a')

    expect(link.text().trim()).toBe('View staff contacts')
    expect(link.attr('href')).toBe('/case/X000001/personal-details/staff-contacts')
  })

  it('renders the throughcare rows as a summary list', () => {
    const $ = render()
    expect(cellText($, '[data-qa="throughcareCard"] .govuk-summary-list__key')).toEqual([
      'Prison offender manager (POM)',
      'Last prison',
      'Release date',
    ])
    expect(cellText($, '[data-qa="throughcareCard"] .govuk-summary-list__value')).toEqual([
      'Rachel Jones',
      'Moorland (HMP & YOI)',
      '16 March 2026',
    ])
  })
})
