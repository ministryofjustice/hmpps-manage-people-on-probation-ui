import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { Name } from '../../../data/model/personalDetails'
import { RiskFlag } from '../../../data/model/risk'
import { AppointmentSession } from '../../../models/Appointments'
import { AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const id = 'a958eb95-1e59-407e-a217-5d7589ab46f5'

type TestModel = {
  crn: string
  id: string
  headerPersonName: Name
  headerCRN: string
  headerDob: string
  tierUrlV3: string
  tierDetails: { calculation: { tierScore: string } }
  allowSms: boolean
  isInPast: boolean
  isSensitive: boolean
  maxCharCount: number
  change?: string
  riskToStaff?: Partial<RiskFlag>
  riskToProbationStaff?: Partial<RiskFlag>
  errorMessages?: Record<string, string>
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  crn,
  id,
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  headerCRN: crn,
  headerDob: '1979-08-18',
  tierUrlV3: 'http://tier/v3/case/X000001',
  tierDetails: { calculation: { tierScore: 'A3' } },
  allowSms: true,
  isInPast: false,
  isSensitive: false,
  maxCharCount: 12000,
  flags: {
    enablePersonHeader: true,
  },
}

const render = (model: Partial<TestModel> = {}, session: Partial<AppointmentSession> = {}) => {
  const input = {
    ...baseModel,
    ...model,
  }
  const req = httpMocks.createRequest({
    params: {
      crn,
      id,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              ...session,
            },
          },
        },
      },
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/supporting-information.njk', input))
}

describe('Add supporting information (optional)', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('title').text()).toContain('Add supporting information (optional) - Arrange appointment')
    expect($('[data-qa=pageHeading]').text().trim()).toBe('Add supporting information (optional)')
    const header = $('main').find('.person-header')
    expect(header.length).toBe(1)
    expect(header.text()).toContain('Caroline Wolff')
    expect(header.text()).toContain(crn)
    expect(header.text()).toContain('18 August 1979')
    expect(header.find('a[href="http://tier/v3/case/X000001"]').text()).toContain('A3')
    expect($('main').find('[data-qa=riskToStaffAlert]').length).toBe(0)
    expect($('.govuk-error-summary').length).toBe(0)

    const notes = $('main').find('[data-qa=notes]')
    expect(notes.find(`#appointments-${crn}-${id}-notes-hint`).text().trim()).toBe(
      'You can add any details that may help you with the appointment. Use paragraphs to make your notes easy to read.',
    )
    expect(notes.find('textarea').attr('id')).toBe(`appointments-${crn}-${id}-notes`)
    expect(notes.find('textarea').attr('name')).toBe(`[appointments][${crn}][${id}][notes]`)
    expect(notes.find('textarea').attr('rows')).toBe('10')
    expect(notes.find('textarea').val()).toBe('')
    expect($('.govuk-character-count').attr('data-maxlength')).toBe('12000')
    expect($(`#appointments-${crn}-${id}-notes-info`).text().trim()).toBe('You can enter up to 12000 characters')

    const sensitivity = $('main').find('[data-qa=visorReport]')
    expect(sensitivity.find('legend').text().trim()).toBe('Does this contact include sensitive information?')
    expect(sensitivity.find('.govuk-hint').text().trim()).toBe(
      'This is information that you believe must be recorded but not shared with a person on probation. If they make a request for their record, the Data Protection Team will decide whether the information can be shared.',
    )
    const radioItems = sensitivity.find('.govuk-radios__item')
    expect(radioItems.length).toBe(2)
    expect(radioItems.eq(0).find('label').text().trim()).toBe('Yes, it includes sensitive information')
    expect(radioItems.eq(0).find('input').attr('value')).toBe('Yes')
    expect(radioItems.eq(1).find('label').text().trim()).toBe('No, it is not sensitive')
    expect(radioItems.eq(1).find('input').attr('value')).toBe('No')
    radioItems.each((i, radioItem) => {
      expect($(radioItem).find('input').attr('name')).toBe(`[appointments][${crn}][${id}][sensitivity]`)
      expect($(radioItem).find('input:checked').length).toBe(0)
    })
    expect($('main').text()).not.toContain('You already told us that this contact includes sensitive information.')
    expect($('main').find('button').text().trim()).toBe('Continue')
  })

  it('should link back to text message confirmation when SMS is allowed', () => {
    const $ = render()
    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/arrange-appointment/${id}/text-message-confirmation`)
  })

  it('should link back to location, date and time when SMS is not allowed', () => {
    const $ = render({ allowSms: false })
    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/arrange-appointment/${id}/location-date-time`)
  })

  it('should use the change link when SMS is allowed', () => {
    const change = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
    const $ = render({ change })
    expect($('.govuk-back-link').attr('href')).toBe(change)
  })

  it('should override the change link when SMS is not allowed', () => {
    const $ = render({
      allowSms: false,
      change: `/case/${crn}/arrange-appointment/${id}/check-your-answers`,
    })
    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/arrange-appointment/${id}/location-date-time`)
  })

  it.each([true, false])('should link back to outcome for a past appointment when allowSms is %s', allowSms => {
    const $ = render({
      allowSms,
      isInPast: true,
      change: `/case/${crn}/arrange-appointment/${id}/check-your-answers`,
    })
    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/arrange-appointment/${id}/outcome`)
  })

  it('should render the medium risk to staff banner', () => {
    const $ = render({ riskToStaff: { id: 1, level: 'MEDIUM' } })
    const alert = $('main').find('[data-qa=riskToStaffAlert]')
    expect(alert.length).toBe(1)
    expect(alert.find('h2').text().trim()).toBe('Caroline may be a risk to probation staff')
    expect(alert.find('a').text().trim()).toBe("View Caroline's medium risk to staff flag")
    expect(alert.find('a').attr('href')).toBe(`/case/${crn}/risk/flag/1`)
  })

  it('should render the risk to probation staff banner', () => {
    const $ = render({ riskToProbationStaff: { id: 2 } })
    const alert = $('main').find('[data-qa=riskToStaffAlert]')
    expect(alert.find('h2').text().trim()).toBe('Caroline is a risk to probation staff')
    expect(alert.find('a').text().trim()).toBe("View Caroline's risk to probation staff flag")
    expect(alert.find('a').attr('href')).toBe(`/case/${crn}/risk/flag/2`)
  })

  it('should hide the sensitivity question when the contact is already sensitive', () => {
    const $ = render({ isSensitive: true })
    expect($('main').find('[data-qa=visorReport]').length).toBe(0)
    expect($('main').find('form').text()).toContain(
      'You already told us that this contact includes sensitive information.',
    )
    expect($('main').find('[data-qa=notes]').length).toBe(1)
  })

  it('should display the validation', () => {
    const errorMessages: Record<string, string> = {
      [`appointments-${crn}-${id}-notes`]: 'Note must be 12000 characters or less',
      [`appointments-${crn}-${id}-sensitivity`]:
        'Select whether or not the appointment note contains sensitive information',
    }
    const $ = render({ errorMessages })
    const notes = $('main').find('[data-qa=notes]')
    const sensitivity = $('main').find('[data-qa=visorReport]')
    expect($('.govuk-error-summary').find('h2').text().trim()).toBe('There is a problem')
    expect($('.govuk-error-summary').find('li').length).toBe(2)
    Object.entries(errorMessages).forEach(([field, message], i) => {
      const link = $('.govuk-error-summary').find('li').eq(i).find('a')
      expect(link.attr('href')).toBe(`#${field}`)
      expect(link.text().trim()).toBe(message)
      expect($(`#${field}`).length).toBe(1)
      expect($(`#${field}-error`).text()).toContain(message)
    })
    expect(notes.hasClass('govuk-form-group--error')).toBe(true)
    expect(sensitivity.hasClass('govuk-form-group--error')).toBe(true)
  })

  it.each<AppointmentSession['sensitivity']>(['Yes', 'No'])(
    'should persist notes and the sensitivity selection of %s',
    sensitivity => {
      const session: Partial<AppointmentSession> = {
        notes: 'A test note\n\nAnother paragraph',
        sensitivity,
      }
      const $ = render({}, session)
      expect($('main').find('[data-qa=notes]').find('textarea').val()).toBe(session.notes)
      const checked = $('main').find('[data-qa=visorReport]').find('input:checked')
      expect(checked.length).toBe(1)
      expect(checked.attr('value')).toBe(sensitivity)
    },
  )
})
