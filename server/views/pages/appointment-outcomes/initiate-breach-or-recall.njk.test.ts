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
const page = 'initiate-breach-or-recall'
const forename = 'James'

const createdByOptions = (type: 'breach' | 'recall'): Option<EnforcementActionCreatedBy>[] => [
  { value: 'CASE_ADMIN', text: 'Case administrator', hint: { text: 'This will be added to the appointment notes.' } },
  { value: 'USER', text: `I’ll initiate the ${type}` },
]

const letterSentByOptions: Option<EnforcementActionCreatedBy>[] = [
  {
    value: 'CASE_ADMIN',
    text: 'Case administrator',
    hint: { text: 'You need to follow your local process to request a letter.' },
  },
  { value: 'USER', text: 'I’ll send the letter' },
]

const breachLetterTypeOptions: Option<EnforcementActionLetterType>[] = [
  { value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' },
  { value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: 'A different enforcement letter' },
]

const custodyLetterTypeOptions: Option<EnforcementActionLetterType>[] = [
  { value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' },
  { value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: 'A different enforcement letter' },
]

const breachOrRecallWarning: BreachOrRecallWarning = {
  title: 'There is a live breach for this sentence',
  text: 'The breach for 12 month community order was initiated on 15 January 2024.',
  type: 'BREACH',
}

const field = (name: string) => `appointments-${crn}-${contactId}-outcome-${name}`

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
  showLetterTypeOptions: false,
  otherAction: false,
  sentence: { type: 'COMMUNITY' } as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome/attended-failed-to-comply`,
  breachOrRecallWarning: null,
  options: createdByOptions('breach'),
  letterSentByOptions,
  letterTypeOptions: breachLetterTypeOptions,
  ticket: null,
}

type TestModel = {
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  headerPersonName: Name
  errorMessages?: Record<string, string>
}

const baseModel: TestModel = {
  appointmentOutcome,
  headerPersonName: { forename, surname: 'Morrison' },
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
    params: { crn, id: contactId, contactId },
    session: { data: { appointments: { [crn]: { [contactId]: session } } } },
  })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/initiate-breach-or-recall.njk', input))
}

const checkOptions = ($: cheerio.CheerioAPI, groupIndex: number, expected: Option[]) => {
  const items = $('[data-module="govuk-radios"]').eq(groupIndex).find('.govuk-radios__item')
  expect(items.length).toBe(expected.length)
  expected.forEach((option, index) => {
    const item = items.eq(index)
    expect(item.find('label').text().trim()).toBe(option.text)
    expect(item.find('input').attr('value')).toBe(option.value)
    expect(item.find('input').attr('checked')).toBeUndefined()
    if (option.hint) {
      expect(item.find('.govuk-hint').text().trim()).toBe(option.hint.text)
    }
  })
}

describe('Initiate a breach or recall', () => {
  describe('Breach (COMMUNITY sentence)', () => {
    it('should render the page', () => {
      const $ = render()
      expect($('.govuk-back-link').attr('href')).toBe(appointmentOutcome.backLink)
      expect($('[data-qa=pageHeading]').text()).toContain('Initiate a breach')
      expect($('[data-qa=pageHeading]').text()).not.toContain('send a letter')
      expect($('title').text()).toContain('Initiate a breach')
      expect($('main').find('legend').length).toBe(1)
      expect($('main').find('legend').text()).toContain('Who will create the breach NSI (non-statutory intervention)?')
      expect($('[data-module="govuk-radios"]').length).toBe(1)
      checkOptions($, 0, createdByOptions('breach'))
      expect($('main').find('button').text().trim()).toBe('Continue')
    })

    it('should render the page with the send letter options', () => {
      const $ = render({
        appointmentOutcome: { sendBreachOrRecallLetter: true, showLetterTypeOptions: true },
      })
      expect($('[data-qa=pageHeading]').text()).toContain('Initiate a breach and send a letter')
      const legends = $('main legend')
      expect(legends.length).toBe(3)
      expect(legends.eq(0).text()).toContain('Who will create the breach NSI (non-statutory intervention)?')
      expect(legends.eq(1).text()).toContain('Who will send the letter?')
      expect(legends.eq(2).text()).toContain('Select the type of letter')
      expect($('[data-module="govuk-radios"]').length).toBe(3)
      checkOptions($, 0, createdByOptions('breach'))
      checkOptions($, 1, letterSentByOptions)
      checkOptions($, 2, breachLetterTypeOptions)
    })

    it('should not render the letter type options if showLetterTypeOptions is false', () => {
      const $ = render({ appointmentOutcome: { sendBreachOrRecallLetter: true, showLetterTypeOptions: false } })
      expect($('[data-module="govuk-radios"]').length).toBe(2)
      expect($('main legend').text()).not.toContain('Select the type of letter')
    })
  })

  describe('Recall (CUSTODY sentence)', () => {
    const custody: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>> = {
      sentence: { type: 'CUSTODY' } as AppointmentOutcomeSentence,
      options: createdByOptions('recall'),
    }

    it('should render the page', () => {
      const $ = render({ appointmentOutcome: custody })
      expect($('[data-qa=pageHeading]').text()).toContain('Initiate a recall')
      expect($('[data-qa=pageHeading]').text()).not.toContain('send a letter')
      expect($('main').find('legend').text()).toContain('Who will create the recall?')
      expect($('[data-module="govuk-radios"]').length).toBe(1)
      checkOptions($, 0, createdByOptions('recall'))
    })

    it('should render the page with the send letter options', () => {
      const $ = render({
        appointmentOutcome: {
          ...custody,
          sendBreachOrRecallLetter: true,
          showLetterTypeOptions: true,
          letterTypeOptions: custodyLetterTypeOptions,
        },
      })
      expect($('[data-qa=pageHeading]').text()).toContain('Initiate a recall and send a letter')
      expect($('main legend').eq(0).text()).toContain('Who will create the recall?')
      expect($('main legend').eq(1).text()).toContain('Who will send the letter?')
      expect($('main legend').eq(2).text()).toContain('Select the type of letter')
      expect($('[data-module="govuk-radios"]').length).toBe(3)
      checkOptions($, 0, createdByOptions('recall'))
      checkOptions($, 1, letterSentByOptions)
      checkOptions($, 2, custodyLetterTypeOptions)
    })
  })

  describe('Warning banner', () => {
    it('should display the breach warning banner', () => {
      const $ = render({ appointmentOutcome: { breachOrRecallWarning } })
      const banner = $('[data-qa="breach-warning"]')
      expect(banner.length).toBe(1)
      expect(banner.find('h2').text().trim()).toBe(breachOrRecallWarning.title)
      expect(banner.find('span').text().trim()).toBe(breachOrRecallWarning.text)
    })

    it('should display the recall warning banner', () => {
      const recallWarning: BreachOrRecallWarning = {
        title: 'There is a live recall for this sentence',
        text: 'The recall for 12 month community order was initiated on 15 January 2024.',
        type: 'RECALL',
      }
      const $ = render({ appointmentOutcome: { breachOrRecallWarning: recallWarning } })
      const banner = $('[data-qa="recall-warning"]')
      expect(banner.length).toBe(1)
      expect(banner.find('h2').text().trim()).toBe(recallWarning.title)
      expect(banner.find('span').text().trim()).toBe(recallWarning.text)
    })

    it('should not display a warning banner when there is no active breach or recall', () => {
      const $ = render()
      expect($('[data-qa="breach-warning"]').length).toBe(0)
      expect($('[data-qa="recall-warning"]').length).toBe(0)
    })
  })

  describe('Validation', () => {
    it('should display the error for the breach created by option', () => {
      const msg = 'Select who will create the breach NSI'
      const $ = render({ errorMessages: { [field('breachNSICreatedBy')]: msg } })
      const summary = $('.govuk-error-summary')
      expect(summary.find('h2').text().trim()).toBe('There is a problem')
      expect(summary.find('li').length).toBe(1)
      expect(summary.find('li a').attr('href')).toBe(`#${field('breachNSICreatedBy')}`)
      expect(summary.find('li a').text().trim()).toBe(msg)
      expect($(`#${field('breachNSICreatedBy')}-error`).text()).toContain(msg)
    })

    it('should display the errors for all three groups when send letter is selected', () => {
      const msgs = {
        breachNSICreatedBy: 'Select who will create the recall',
        letterSentBy: 'Select who will send the letter',
        letterType: 'Select the type of letter',
      }
      const $ = render({
        appointmentOutcome: {
          sentence: { type: 'CUSTODY' } as AppointmentOutcomeSentence,
          options: createdByOptions('recall'),
          sendBreachOrRecallLetter: true,
          showLetterTypeOptions: true,
          letterTypeOptions: custodyLetterTypeOptions,
        },
        errorMessages: {
          [field('breachNSICreatedBy')]: msgs.breachNSICreatedBy,
          [field('letterSentBy')]: msgs.letterSentBy,
          [field('letterType')]: msgs.letterType,
        },
      })
      const items = $('.govuk-error-summary li')
      expect(items.length).toBe(3)
      Object.entries(msgs).forEach(([name, msg], index) => {
        expect(items.eq(index).find('a').attr('href')).toBe(`#${field(name)}`)
        expect(items.eq(index).find('a').text().trim()).toBe(msg)
        expect($(`#${field(name)}-error`).text()).toContain(msg)
      })
    })

    it('should only display errors for the groups that have errors', () => {
      const $ = render({
        appointmentOutcome: { sendBreachOrRecallLetter: true, showLetterTypeOptions: true },
        errorMessages: {
          [field('letterSentBy')]: 'Select who will send the letter',
          [field('letterType')]: 'Select the type of letter',
        },
      })
      expect($('.govuk-error-summary li').length).toBe(2)
      expect($(`#${field('breachNSICreatedBy')}-error`).length).toBe(0)
      expect($(`#${field('letterSentBy')}-error`).text()).toContain('Select who will send the letter')
      expect($(`#${field('letterType')}-error`).text()).toContain('Select the type of letter')
    })
  })

  describe('Persisted selection', () => {
    it('should persist the selected options', () => {
      const session = {
        outcome: {
          breachNSICreatedBy: 'USER',
          letterSentBy: 'CASE_ADMIN',
          letterType: 'OTHER_ENFORCEMENT_LETTER_SENT',
        },
      }
      const $ = render({ appointmentOutcome: { sendBreachOrRecallLetter: true, showLetterTypeOptions: true } }, session)
      const checked = (group: number) =>
        $('[data-module="govuk-radios"]').eq(group).find('input[checked]').attr('value')
      expect(checked(0)).toBe('USER')
      expect(checked(1)).toBe('CASE_ADMIN')
      expect(checked(2)).toBe('OTHER_ENFORCEMENT_LETTER_SENT')
    })
  })
})
