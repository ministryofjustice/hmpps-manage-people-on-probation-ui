import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

interface CardContent {
  text?: string
  html?: string
  classes?: string
}

interface CardTitle extends CardContent {
  headingLevel?: number
}

interface CardAction extends CardContent {
  href: string
  visuallyHiddenText?: string
  attributes?: Record<string, string>
}

interface GenericHmppsCardParams {
  title?: CardTitle
  titleCaption?: CardContent
  actions?: { items: CardAction[]; classes?: string }
  text?: string
  html?: string
  classes?: string
  attributes?: Record<string, string>
}

const env = createNunjucksTestEnv()

const render = (params: GenericHmppsCardParams = {}, caller?: string): cheerio.CheerioAPI => {
  const template = caller
    ? `{% from "_components/generic-hmpps-card/macro.njk" import genericHMPPSCard %}{% call genericHMPPSCard(params) %}${caller}{% endcall %}`
    : '{% from "_components/generic-hmpps-card/macro.njk" import genericHMPPSCard %}{{ genericHMPPSCard(params) }}'
  return cheerio.load(env.renderString(template, { params }))
}

describe('genericHMPPSCard', () => {
  it('renders the card with the generic card class', () => {
    const $ = render({ classes: 'extra-class' })
    const card = $('.govuk-summary-card')
    expect(card.length).toBe(1)
    expect(card.hasClass('app-hmpps-generic-card')).toBe(true)
    expect(card.hasClass('extra-class')).toBe(true)
  })

  it('renders attributes on the card', () => {
    const $ = render({ attributes: { 'data-qa': 'my-card' } })
    expect($('.govuk-summary-card').attr('data-qa')).toBe('my-card')
  })

  describe('title', () => {
    it('renders an h3 by default', () => {
      const $ = render({ title: { text: 'Card title' } })
      expect($('h3.govuk-summary-card__title').text().trim()).toBe('Card title')
    })

    it('renders the requested heading level', () => {
      const $ = render({ title: { text: 'Card title', headingLevel: 2 } })
      expect($('h2.govuk-summary-card__title').length).toBe(1)
      expect($('h3').length).toBe(0)
    })

    it('renders html in preference to text and applies classes', () => {
      const $ = render({ title: { html: '<em>Html title</em>', text: 'Text title', classes: 'title-class' } })
      const heading = $('.govuk-summary-card__title')
      expect(heading.hasClass('title-class')).toBe(true)
      expect(heading.find('em').text()).toBe('Html title')
      expect(heading.text()).not.toContain('Text title')
    })

    it('escapes text', () => {
      const $ = render({ title: { text: '<b>bold</b>' } })
      expect($('.govuk-summary-card__title b').length).toBe(0)
      expect($('.govuk-summary-card__title').text()).toContain('<b>bold</b>')
    })

    it('does not render a heading when no title is given', () => {
      const $ = render()
      expect($('.govuk-summary-card__title').length).toBe(0)
    })
  })

  describe('title caption', () => {
    it('renders caption text before the title', () => {
      const $ = render({ title: { text: 'Title' }, titleCaption: { text: 'Caption' } })
      const caption = $('.app-hmpps-generic-card__caption')
      expect(caption.text().trim()).toBe('Caption')
      expect($('.govuk-summary-card__title').text()).toContain('Title')
    })

    it('renders caption html in preference to text', () => {
      const $ = render({ title: { text: 'Title' }, titleCaption: { html: '<strong>Html</strong>', text: 'Text' } })
      expect($('.app-hmpps-generic-card__caption strong').text()).toBe('Html')
    })

    it('does not render a caption when none is given', () => {
      const $ = render({ title: { text: 'Title' } })
      expect($('.app-hmpps-generic-card__caption').length).toBe(0)
    })
  })

  describe('actions', () => {
    it('renders no actions when there are none', () => {
      const $ = render({ title: { text: 'Title' } })
      expect($('.govuk-summary-card__actions').length).toBe(0)
    })

    it('renders a single action as a div without a list', () => {
      const $ = render({
        title: { text: 'Title' },
        actions: { items: [{ href: '/edit', text: 'Edit', visuallyHiddenText: 'details' }], classes: 'actions-class' },
      })
      const actions = $('div.govuk-summary-card__actions')
      expect(actions.length).toBe(1)
      expect(actions.hasClass('actions-class')).toBe(true)
      expect($('ul').length).toBe(0)
      const link = actions.find('a.govuk-link')
      expect(link.attr('href')).toBe('/edit')
      expect(link.find('.govuk-visually-hidden').text().trim()).toBe('details (Title)')
    })

    it('renders multiple actions as a list', () => {
      const $ = render({
        title: { text: 'Title' },
        actions: {
          items: [
            { href: '/one', text: 'One', classes: 'link-class', attributes: { 'data-qa': 'one' } },
            { href: '/two', html: '<span>Two</span>' },
          ],
        },
      })
      const items = $('ul.govuk-summary-card__actions li.govuk-summary-card__action')
      expect(items.length).toBe(2)
      const first = items.eq(0).find('a')
      expect(first.attr('href')).toBe('/one')
      expect(first.hasClass('link-class')).toBe(true)
      expect(first.attr('data-qa')).toBe('one')
      expect(items.eq(1).find('a span').first().text()).toBe('Two')
    })

    it('uses the title as hidden text only when no visually hidden text is given', () => {
      const $ = render({ title: { text: 'Title' }, actions: { items: [{ href: '/a', text: 'A' }] } })
      expect($('a .govuk-visually-hidden').text().trim()).toBe('(Title)')
    })

    it('adds no hidden text without a title or visually hidden text', () => {
      const $ = render({ actions: { items: [{ href: '/a', text: 'A' }] } })
      expect($('a .govuk-visually-hidden').length).toBe(0)
    })
  })

  describe('body', () => {
    it('renders text content', () => {
      const $ = render({ text: 'Body text' })
      expect($('.govuk-summary-card__content').text().trim()).toBe('Body text')
    })

    it('renders html in preference to text', () => {
      const $ = render({ html: '<p>Body html</p>', text: 'Body text' })
      expect($('.govuk-summary-card__content p').text()).toBe('Body html')
    })

    it('renders caller content', () => {
      const $ = render({ title: { text: 'Title' } }, '<p class="from-caller">Caller body</p>')
      expect($('.govuk-summary-card__content .from-caller').text()).toBe('Caller body')
    })

    it('does not render a content wrapper when there is no body', () => {
      const $ = render({ title: { text: 'Title' } })
      expect($('.govuk-summary-card__content').length).toBe(0)
    })
  })
})
