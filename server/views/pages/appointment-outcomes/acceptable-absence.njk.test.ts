import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { AppointmentOutcomeProps, AppointmentOutcomeSentence, AppResponse } from '../../../models/Locals'
import { Activity } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { Name } from '../../../data/model/personalDetails'
import { TierCalculation } from '../../../data/tierApiClient'
import { acceptableAbsenceOptions } from '../../../properties/appointment-outcomes'

const crn = 'X000001'
const contactId = '1234'
const forename = 'James'
const error = 'Select why their absence was acceptable'
const appointmentHintText = 'Appointment: 3 way meeting (NS) with Terry Jones on Wednesday 21 February 2024.'

const optionsOver24Months = acceptableAbsenceOptions
const optionsUnder24Months = acceptableAbsenceOptions.filter(option => option.value !== 'ACCEPTABLE_FAILURE')

const errorMessages: Record<string, string> = {
  [`appointments-${crn}-${contactId}-outcome-acceptableAbsence`]: error,
}

const riskData: RiskData = { assessments: [], httpStatus: 200 }

const appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>> = {
  crn,
  id: contactId,
  uuid: undefined,
  contactId,
  forename,
  appointment: {} as Activity,
  documents: [],
  isValidParams: true,
  isInPast: true,
  reqUrl: '',
  baseUrl: '',
  baseOutcomeUrl: `/case/${crn}/appointments/appointment/${contactId}/outcome/acceptable-absence`,
  completedUrl: '',
  appointmentSession: {},
  isProbationPractitioner: false,
  appointmentHintText,
  sendBreachOrRecallLetter: false,
  sendLetter: false,
  showLetterTypeOptions: false,
  otherAction: false,
  sentence: {} as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
  breachOrRecallWarning: null,
  options: optionsOver24Months,
  ticket: null,
}

type TestModel = {
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  headerPersonName: Name
  headerCRN: string
  headerDob: string
  headerTierLink: string
  tierCalculation: Partial<TierCalculation>
  riskData: RiskData
  errorMessages?: Record<string, string>
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  appointmentOutcome,
  headerPersonName: { forename, surname: 'Morrison' },
  headerCRN: crn,
  headerDob: '1974-10-19',
  headerTierLink: 'http://tier/link',
  riskData,
  tierCalculation: { tierScore: 'C' },
  flags: { enablePersonHeader: true },
}

const render = (model = {} as Partial<TestModel>, session = {}) => {
  const input = {
    ...baseModel,
    ...model,
    appointmentOutcome: { ...baseModel.appointmentOutcome, ...model.appointmentOutcome },
  }
  const req = httpMocks.createRequest({
    params: { crn, id: contactId, contactId },
    session: { data: { appointments: { [crn]: { [contactId]: session } } } },
  })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/acceptable-absence.njk', input))
}

const checkOptions = ($: cheerio.CheerioAPI, expected: typeof acceptableAbsenceOptions) => {
  const items = $('.govuk-radios > div')
  expect(items.length).toBe(expected.length)
  items.each((index, element) => {
    expect($(element).find('input').attr('value')).toBe(expected[index].value)
    expect($(element).find('input').attr('checked')).toBeUndefined()
    expect($(element).find('label').text().trim()).toBe(expected[index].text)
    if (expected[index].hint) {
      expect($(element).find('.govuk-hint').text().trim()).toBe(expected[index].hint.text)
    }
  })
}

describe('Acceptable Absence Page', () => {
  it('should render the page with the acceptable failure option if sentence length is over 24 months', () => {
    const $ = render()
    expect($('main').find('.person-header').length).toBe(1)
    expect($('.govuk-back-link').attr('href')).toBe(appointmentOutcome.backLink)
    expect($('[data-qa=pageHeading]').text()).toContain(`Why was ${forename}’s absence acceptable?`)
    expect($('main').find('legend').text()).toContain(`Why was ${forename}’s absence acceptable?`)
    expect($('main').find('.govuk-hint').first().text()).toContain(appointmentHintText)
    checkOptions($, optionsOver24Months)
    expect($('.govuk-radios__input[value=ACCEPTABLE_FAILURE]').length).toBe(1)
    expect($('main').find('button').text().trim()).toBe('Continue')
  })

  it('should render the page without the acceptable failure option if sentence length is 24 months or less', () => {
    const $ = render({ appointmentOutcome: { options: optionsUnder24Months } })
    checkOptions($, optionsUnder24Months)
    expect($('.govuk-radios__input[value=ACCEPTABLE_FAILURE]').length).toBe(0)
  })

  it('should post the selected option to the acceptable absence outcome field', () => {
    const $ = render()
    expect($('form').attr('method')).toBe('post')
    $('.govuk-radios__input').each((_, element) => {
      expect($(element).attr('name')).toBe(`[appointments][${crn}][${contactId}][outcome][acceptableAbsence]`)
    })
  })

  it('should display the validation error when no option is selected', () => {
    const $ = render({ errorMessages })
    const summary = $('.govuk-error-summary')
    expect(summary.find('h2').text().trim()).toEqual('There is a problem')
    expect(summary.find('li').length).toBe(1)
    expect(summary.find('li a').attr('href')).toBe(`#appointments-${crn}-${contactId}-outcome-acceptableAbsence`)
    expect(summary.find('li a').text().trim()).toBe(error)
    expect($('form > .govuk-form-group').hasClass('govuk-form-group--error')).toBe(true)
    expect($('form').find('.govuk-error-message').text().trim()).toContain(error)
  })

  it('should persist the selection', () => {
    const session = { outcome: { outcomeType: 'ACCEPTABLE_ABSENCE', acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY' } }
    const $ = render({}, session)
    const checked = $('.govuk-radios__input[checked]')
    expect(checked.length).toBe(1)
    expect(checked.attr('value')).toBe('ACCEPTABLE_ABSENCE_HOLIDAY')
  })
})
