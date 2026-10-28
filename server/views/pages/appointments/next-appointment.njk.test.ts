import * as cheerio from 'cheerio'
import { Environment } from 'nunjucks'
import httpMocks from 'node-mocks-http'
import { AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

let env: Environment

const crn = 'X000001'
const id = '2'

const baseModel = {
  crn,
  id,
  flags: {},
  paths: { current: `/case/${crn}/appointments/appointment/${id}/next-appointment` },
  body: {},
  errorMessages: undefined as Record<string, unknown> | undefined,
  outcomeJourney: false,
  back: undefined as string | undefined,
  personAppointment: {
    personSummary: { name: { forename: 'Eula', surname: 'Schmeler' } },
    appointment: {
      type: 'planned office visit (NS)',
      displayName: 'planned office visit (NS)',
      description: undefined as string | undefined,
    },
  },
  appointment: { appointmentFor: { sentence: 'Pre-Sentence' } },
  nextAppointment: {
    appointment: {
      startDateTime: '2024-02-21T10:15:00.000Z',
      officer: { name: { forename: 'Terry', surname: 'Jones' } },
    },
  } as Record<string, unknown>,
}

const render = (overrides: Record<string, unknown> = {}) =>
  cheerio.load(env.render('pages/appointments/next-appointment.njk', { ...baseModel, ...overrides }))

describe('Next Appointment Page', () => {
  beforeAll(() => {
    env = createNunjucksTestEnv()
  })

  describe('appointments', () => {
    it('should display the page title and heading with the forename', () => {
      const $ = render()
      expect($('[data-qa=pageHeading]').text().trim()).toBe('Eula’s next supervision appointment')
    })

    it('should display the next appointment in the inset text', () => {
      const $ = render()
      expect($('.govuk-inset-text').text()).toContain(
        'Planned office visit (NS) on Wednesday 21 February 2024 at 10:15am with Terry Jones for their Pre-Sentence',
      )
    })

    it('should display the no upcoming appointments message when there is no next appointment', () => {
      const $ = render({ nextAppointment: {} })
      expect($('.govuk-inset-text').text()).toContain(
        'There are no upcoming supervision appointments for Eula’s Pre-Sentence.',
      )
    })

    it('should include the description in the appointment name when present', () => {
      const $ = render({
        personAppointment: {
          ...baseModel.personAppointment,
          appointment: { ...baseModel.personAppointment.appointment, description: 'Planned' },
        },
        nextAppointment: {},
      })
      expect($('[data-qa=anotherAppointment] input[value=KEEP_TYPE]').next('label').text()).toContain(
        'Yes - another planned - planned office visit (NS)',
      )
    })

    it('should display the radio legend', () => {
      const $ = render()
      expect($('[data-qa=anotherAppointment] legend').text()).toContain(
        'Do you want to arrange another appointment with Eula?',
      )
    })

    it('should display the radio options in order', () => {
      const $ = render()
      const labels = $('[data-qa=anotherAppointment] .govuk-radios__label')
        .map((_, el) => $(el).text().trim())
        .get()
      expect(labels).toEqual(['Yes - another planned office visit (NS)', 'Yes - another appointment type', 'No'])
      const values = $('[data-qa=anotherAppointment] .govuk-radios__input')
        .map((_, el) => $(el).attr('value'))
        .get()
      expect(values).toEqual(['KEEP_TYPE', 'CHANGE_TYPE', 'NO'])
    })

    it('should not pre-select an option by default', () => {
      const $ = render()
      expect($('.govuk-radios__input:checked')).toHaveLength(0)
    })

    it.each(['KEEP_TYPE', 'CHANGE_TYPE', 'NO'])('should pre-select %s from the body', value => {
      const $ = render({ body: { nextAppointment: value } })
      expect($('.govuk-radios__input:checked').attr('value')).toBe(value)
    })

    it('should name the radios nextAppointment', () => {
      const $ = render()
      expect($('.govuk-radios__input').first().attr('name')).toBe('nextAppointment')
    })

    it('should link the back link to the manage page by default', () => {
      const $ = render()
      expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments/appointment/${id}/manage/`)
    })

    it('should use the back link from the model when provided', () => {
      const $ = render({ back: '/some/other/page' })
      expect($('.govuk-back-link').attr('href')).toBe('/some/other/page')
    })

    it('should display the error summary and message when no selection is made', () => {
      const $ = render({
        errorMessages: { nextAppointment: 'Select if you want to arrange the next appointment' },
      })
      expect($('[data-qa=errorList]').text()).toContain('Select if you want to arrange the next appointment')
      expect($('.govuk-error-message').text()).toContain('Select if you want to arrange the next appointment')
    })

    it('should not display an error when there are no errors', () => {
      const $ = render()
      expect($('[data-qa=errorList]')).toHaveLength(0)
      expect($('.govuk-error-message')).toHaveLength(0)
    })

    it('should post to the current path with a Continue button', () => {
      const $ = render()
      expect($('form').attr('action')).toBe(baseModel.paths.current)
      expect($('[data-qa=submit-btn]').text()).toContain('Continue')
    })
  })

  describe('appointmentOutcome', () => {
    const fieldId = `appointments-${crn}-${id}-outcome-nextAppointment`
    const fieldName = `[appointments][${crn}][${id}][outcome][nextAppointment]`

    const renderOutcome = ({ stored, errors }: { stored?: string; errors?: Record<string, string> } = {}) => {
      const model = { ...baseModel, outcomeJourney: true, errorMessages: errors }
      const req = httpMocks.createRequest({
        params: { crn, id },
        session: {
          data: stored ? { appointments: { [crn]: { [id]: { outcome: { nextAppointment: stored } } } } } : {},
        },
      })
      const res = httpMocks.createResponse({ locals: model }) as AppResponse
      return cheerio.load(createNunjucksTestEnv(req, res).render('pages/appointments/next-appointment.njk', model))
    }

    it('should display the page heading and inset text', () => {
      const $ = renderOutcome()
      expect($('[data-qa=pageHeading]').text().trim()).toBe('Eula’s next supervision appointment')
      expect($('.govuk-inset-text').text()).toContain(
        'Planned office visit (NS) on Wednesday 21 February 2024 at 10:15am with Terry Jones for their Pre-Sentence',
      )
    })

    it('should display the legend and the three options', () => {
      const $ = renderOutcome()
      expect($('[data-qa=anotherAppointment] legend').text()).toContain(
        'Do you want to arrange another appointment with Eula?',
      )
      const values = $('[data-qa=anotherAppointment] .govuk-radios__input')
        .map((_, el) => $(el).attr('value'))
        .get()
      expect(values).toEqual(['KEEP_TYPE', 'CHANGE_TYPE', 'NO'])
    })

    it('should bind the radios to the nested outcome name and id', () => {
      const $ = renderOutcome()
      const radios = $('[data-qa=anotherAppointment] .govuk-radios__input')
      expect(radios).toHaveLength(3)
      radios.each((_, el) => {
        expect($(el).attr('name')).toBe(fieldName)
      })
      expect(radios.first().attr('id')).toBe(fieldId)
    })

    it('should not pre-select an option when nothing is stored in the session', () => {
      const $ = renderOutcome()
      expect($('.govuk-radios__input:checked')).toHaveLength(0)
    })

    test.each`
      value
      ${'KEEP_TYPE'}
      ${'CHANGE_TYPE'}
      ${'NO'}
    `('should restore $value from the session', ({ value }) => {
      const $ = renderOutcome({ stored: value })
      const checked = $('.govuk-radios__input:checked')
      expect(checked).toHaveLength(1)
      expect(checked.attr('value')).toBe(value)
    })

    it('should display the field error against the nested outcome field', () => {
      const message = 'Select if you want to arrange the next appointment'
      const $ = renderOutcome({ errors: { [fieldId]: message } })
      expect($('[data-qa=errorList]').text()).toContain(message)
      expect($('[data-qa=errorList] a').attr('href')).toBe(`#${fieldId}`)
      expect($('[data-qa=anotherAppointment] .govuk-error-message').text()).toContain(message)
    })
  })
})
