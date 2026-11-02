import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'
const fieldId = `appointments-${crn}-${id}-eventId`

type Sentence = {
  id: string
  order: { description?: string; startDate?: string }
  requirements: { id: string; description: string; active: boolean }[]
  licenceConditions: { id: string; mainDescription: string; active: boolean }[]
}

const sentenceList: Sentence[] = [
  {
    id: '1',
    order: { description: 'ORA Adult Custody (inc PSS) (12 Months)', startDate: '2025-01-15' },
    requirements: [],
    licenceConditions: [],
  },
  {
    id: '2',
    order: { description: 'ORA Community Order (6 Months)', startDate: '2024-03-01' },
    requirements: [{ id: 'r1', description: 'Unpaid Work', active: false }],
    licenceConditions: [],
  },
  {
    id: '3',
    order: { description: 'Suspended Sentence Order (18 Months)' },
    requirements: [],
    licenceConditions: [],
  },
]

type TestModel = {
  sentenceList: Sentence[]
  errorMessages: Record<string, string> | null
  riskToStaff: { id: string; level: string } | null
  riskToProbationStaff: { id: string } | null
  back: string
  change: string
}

const render = (model: Partial<TestModel> = {}) => {
  const input: Record<string, unknown> = {
    sentenceList,
    crn,
    id,
    headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
    headerCRN: crn,
    flags: {},
    errorMessages: null,
    ...model,
  }
  const req = httpMocks.createRequest({ params: { crn, id }, session: { data: {} } })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/sentence.njk', input))
}

describe('What is this appointment for? page', () => {
  describe('page content', () => {
    it('should render the question as the fieldset legend', () => {
      const $ = render()
      expect($('[data-qa=pageHeading]').text()).toBe('What is this appointment for?')
      expect($('[data-qa=sentences] legend').hasClass('govuk-fieldset__legend--l')).toBe(true)
    })

    it('should set the page title', () => {
      const $ = render()
      expect($('title').text()).toContain('What is this appointment for?')
      expect($('title').text()).toContain('Arrange appointment')
    })

    it('should render a submit button', () => {
      const $ = render()
      expect($('[data-qa=submit-btn]').length).toBe(1)
    })
  })

  describe('sentence radios', () => {
    it('should render one unselected radio per sentence', () => {
      const $ = render()
      const radios = $('input[data-sentence="true"]')
      expect(radios.length).toBe(3)
      radios.each((_i, radio) => {
        expect($(radio).attr('type')).toBe('radio')
        expect($(radio).attr('checked')).toBeUndefined()
      })
    })

    it('should use the sentence id as the radio value', () => {
      const $ = render()
      const values = $('input[data-sentence="true"]')
        .map((_i, radio) => $(radio).attr('value'))
        .get()
      expect(values).toEqual(['1', '2', '3'])
    })

    it('should decorate the radios with the form field name and ids', () => {
      const $ = render()
      const radios = $('input[data-sentence="true"]')
      expect(radios.eq(0).attr('id')).toBe(fieldId)
      expect(radios.eq(1).attr('id')).toBe(`${fieldId}-2`)
      expect(radios.eq(2).attr('id')).toBe(`${fieldId}-3`)
      expect(radios.eq(0).attr('name')).toBe(`[appointments][${crn}][${id}][eventId]`)
    })

    it('should reset conditional radios', () => {
      const $ = render()
      expect($('input[data-sentence="true"]').first().attr('data-reset-conditional-radios')).toBe('')
    })

    it('should display the sentence description in a bold label', () => {
      const $ = render()
      const label = $(`label[for="${fieldId}"]`)
      expect(label.text().trim()).toBe('ORA Adult Custody (inc PSS) (12 Months)')
      expect(label.hasClass('govuk-!-font-weight-bold')).toBe(true)
    })

    it('should display the sentence start date hint when there is a start date', () => {
      const $ = render()
      expect($(`#${fieldId}-item-hint`).text().trim()).toBe('Sentence start date: 15 January 2025.')
      expect($(`#${fieldId}-2-item-hint`).text().trim()).toBe('Sentence start date: 1 March 2024.')
    })

    it('should not display a start date when the sentence has none', () => {
      const $ = render()
      expect($(`#${fieldId}-3-item-hint`).text().trim()).toBe('')
      expect($('.govuk-radios__item').eq(2).text()).not.toContain('Sentence start date')
    })

    it('should not display requirements or licence conditions as options', () => {
      const $ = render()
      expect($('.govuk-radios__item').length).toBe(3)
      expect($('.govuk-radios').text()).not.toContain('Unpaid Work')
    })

    it('should not render a sentence without an order description', () => {
      const $ = render({
        sentenceList: [...sentenceList, { id: '4', order: {}, requirements: [], licenceConditions: [] }],
      })
      expect($('input[data-sentence="true"]').length).toBe(3)
    })

    it('should render no radios when there are no sentences', () => {
      const $ = render({ sentenceList: [] })
      expect($('input[data-sentence="true"]').length).toBe(0)
    })
  })

  describe('back link', () => {
    it('should default to the appointments page', () => {
      const $ = render()
      expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments`)
    })

    it('should use the back url when provided', () => {
      const $ = render({ back: '/some/back' })
      expect($('.govuk-back-link').attr('href')).toBe('/some/back')
    })

    it('should prefer the change url over the back url', () => {
      const $ = render({ back: '/some/back', change: '/some/change' })
      expect($('.govuk-back-link').attr('href')).toBe('/some/change')
    })
  })

  describe('risk to staff alert', () => {
    it('should not display the alert when there is no risk', () => {
      const $ = render()
      expect($('[data-qa=riskToStaffAlert]').length).toBe(0)
    })

    it('should display the alert with the risk to staff flag link', () => {
      const $ = render({ riskToStaff: { id: 'abc', level: 'MEDIUM' } })
      const alert = $('[data-qa=riskToStaffAlert]')
      expect(alert.text()).toContain('Caroline may be a risk to probation staff')
      expect(alert.find('a').attr('href')).toBe(`/case/${crn}/risk/flag/abc`)
    })

    it('should display the alert with the risk to probation staff flag link', () => {
      const $ = render({ riskToProbationStaff: { id: 'def' } })
      const alert = $('[data-qa=riskToStaffAlert]')
      expect(alert.text()).toContain('Caroline is a risk to probation staff')
      expect(alert.find('a').attr('href')).toBe(`/case/${crn}/risk/flag/def`)
    })
  })

  describe('validation errors', () => {
    const errorMessages = { [fieldId]: 'Select what this appointment is for' }

    it('should not display errors by default', () => {
      const $ = render()
      expect($('.govuk-error-summary').length).toBe(0)
      expect($(`#${fieldId}-error`).length).toBe(0)
    })

    it('should display the error summary linking to the first radio', () => {
      const $ = render({ errorMessages })
      expect($('[data-qa=errorList]').text()).toContain('Select what this appointment is for')
      expect($('.govuk-error-summary a').attr('href')).toBe(`#${fieldId}`)
    })

    it('should display the inline error message', () => {
      const $ = render({ errorMessages })
      expect($(`#${fieldId}-error`).text()).toContain('Select what this appointment is for')
    })
  })
})
