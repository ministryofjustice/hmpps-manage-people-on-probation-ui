import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import {
  AppointmentOutcomeProps,
  AppointmentOutcomeSentence,
  AppResponse,
  BreachOrRecallWarning,
} from '../../../models/Locals'
import { Activity } from '../../../data/model/schedule'
import {
  AttendedCompliedAppointment,
  EnforcementActionCreatedBy,
  EnforcementActionLetterType,
} from '../../../models/Appointments'
import { Option } from '../../../models/Option'
import { Name } from '../../../data/model/personalDetails'

const crn = 'X000001'
const contactId = '1234'
const page = 'send-letter'
const forename = 'James'

const letterSentByOptions: Option<EnforcementActionCreatedBy>[] = [
  {
    value: 'CASE_ADMIN',
    text: 'Case administrator',
    hint: { text: 'You need to follow your local process to request a letter.' },
  },
  { value: 'USER', text: 'I’ll send the letter' },
]

const letterTypeOptions: Option<EnforcementActionLetterType>[] = [
  { value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' },
  { value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' },
  { value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: 'A different enforcement letter' },
]

const breachOrRecallWarning: BreachOrRecallWarning = {
  title: `There is a live recall for this sentence`,
  text: `The recall for sentence order was initiated on 10 October 2026.`,
  type: 'RECALL',
}

const errorMessages: Record<string, string> = {
  [`appointments-${crn}-${contactId}-outcome-letterSentBy`]: 'Select who will send the letter',
  [`appointments-${crn}-${contactId}-outcome-letterType`]: 'Select the type of letter',
}

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
  baseOutcomeUrl: `/case/${crn}/appointments/appointment/${contactId}/outcome/${page}`,
  completedUrl: '',
  appointmentSession: {},
  isProbationPractitioner: false,
  appointmentHintText: '',
  sendBreachOrRecallLetter: false,
  sendLetter: false,
  otherAction: false,
  showLetterTypeOptions: true,
  sentence: {} as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome/attended-failed-to-comply`,
  breachOrRecallWarning: null,
  letterSentByOptions,
  letterTypeOptions,
}

type TestModel = {
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  headerPersonName: Name
  errorMessages?: Record<string, string>
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  appointmentOutcome,
  headerPersonName: {
    forename,
    surname: 'Morrison',
  },
  flags: {
    enablePersonHeader: true,
  },
}

const render = (model = {} as Partial<TestModel>, session = {}) => {
  const input = {
    ...baseModel,
    ...model,
    appointmentOutcome: {
      ...baseModel.appointmentOutcome,
      ...model.appointmentOutcome,
    },
  }
  const req = httpMocks.createRequest({
    params: {
      crn,
      id: contactId,
      contactId,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [contactId]: session,
          },
        },
      },
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/send-letter.njk', input))
}

describe('Send a letter', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('.govuk-back-link').attr('href')).toBe(appointmentOutcome.backLink)
    expect($('main').find('.person-header').length).toBe(1)
    expect($('[data-qa=pageHeading]').text()).toContain('Send a letter')
    expect($('[data-module="govuk-radios"]').length).toBe(2)

    const letterSentByFieldset = $('fieldset').eq(0)
    expect(letterSentByFieldset.find('legend').text()).toContain('Who will send the letter?')
    const letterSentByItems = letterSentByFieldset.find('.govuk-radios__item')
    expect(letterSentByItems.length).toBe(letterSentByOptions.length)
    letterSentByItems.each((index, element) => {
      expect($(element).find('input').attr('checked')).toBeUndefined()
      expect($(element).find('label').text().trim()).toBe(letterSentByOptions[index].text)
      if (letterSentByOptions[index].hint) {
        expect($(element).find('.govuk-hint').text().trim()).toBe(letterSentByOptions[index].hint.text)
      }
    })

    const letterTypeFieldset = $('fieldset').eq(1)
    expect(letterTypeFieldset.find('legend').text()).toContain('Select the type of letter')
    const letterTypeItems = letterTypeFieldset.find('.govuk-radios__item')
    expect(letterTypeItems.length).toBe(letterTypeOptions.length)
    letterTypeItems.each((index, element) => {
      expect($(element).find('input').attr('checked')).toBeUndefined()
      expect($(element).find('label').text().trim()).toBe(letterTypeOptions[index].text)
    })

    expect($('main').find('button').text().trim()).toBe('Continue')
  })

  it('should not show the letter type options when showLetterTypeOptions is false', () => {
    const $ = render({ appointmentOutcome: { showLetterTypeOptions: false } })
    expect($('[data-qa=letterType]').length).toBe(0)
    expect($('[data-module="govuk-radios"]').length).toBe(1)
  })

  it('should display the breach/recall warning banner', () => {
    const $ = render({ appointmentOutcome: { breachOrRecallWarning } })
    expect($('[data-qa="recall-warning"]').length).toBe(1)
    expect($('[data-qa="recall-warning"]').find('h2').text().trim()).toBe(breachOrRecallWarning.title)
    expect($('[data-qa="recall-warning"]').find('span').text().trim()).toBe(breachOrRecallWarning.text)
  })

  it('should display the validation', () => {
    const $ = render({ errorMessages })
    expect($('.govuk-error-summary').find('h2').text().trim()).toEqual('There is a problem')
    expect($('.govuk-error-summary').find('li').length).toBe(2)
    expect($('.govuk-error-summary').find('li').eq(0).find('a').attr('href')).toBe(
      `#appointments-${crn}-${contactId}-outcome-letterSentBy`,
    )
    expect($('.govuk-error-summary').find('li').eq(0).find('a').text().trim()).toBe(
      errorMessages[`appointments-${crn}-${contactId}-outcome-letterSentBy`],
    )
    expect($('.govuk-error-summary').find('li').eq(1).find('a').attr('href')).toBe(
      `#appointments-${crn}-${contactId}-outcome-letterType`,
    )
    expect($('.govuk-error-summary').find('li').eq(1).find('a').text().trim()).toBe(
      errorMessages[`appointments-${crn}-${contactId}-outcome-letterType`],
    )
    expect($('.govuk-form-group').eq(0).hasClass('govuk-form-group--error')).toBe(true)
    expect($('.govuk-form-group').eq(1).hasClass('govuk-form-group--error')).toBe(true)
    expect($('.govuk-error-message').length).toBe(2)
  })

  it('should persist the selection', () => {
    const session = {
      outcome: {
        letterSentBy: 'USER',
        letterType: 'BREACH_LETTER_SENT',
      },
    }
    const $ = render({}, session)
    expect($('fieldset').eq(0).find('.govuk-radios__item').eq(1).find('input').attr('checked')).toBeDefined()
    expect($('fieldset').eq(1).find('.govuk-radios__item').eq(1).find('input').attr('checked')).toBeDefined()
  })
})
