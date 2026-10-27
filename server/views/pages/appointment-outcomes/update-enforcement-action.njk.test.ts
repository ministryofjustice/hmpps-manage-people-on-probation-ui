import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import {
  AppointmentOutcomeProps,
  AppointmentOutcomeSentence,
  AppResponse,
  CurrentEnforcementAction,
} from '../../../models/Locals'
import { Activity } from '../../../data/model/schedule'
import { AppointmentEnforcementAction, AttendedCompliedAppointment } from '../../../models/Appointments'
import { Option } from '../../../models/Option'
import { Name } from '../../../data/model/personalDetails'

const crn = 'X000001'
const contactId = '1234'
const page = 'enforcement-action'
const forename = 'James'
const error = 'Select another enforcement action'

const options: Option<AppointmentEnforcementAction>[] = [
  { text: 'Send a letter', value: 'SEND_LETTER' },
  { text: 'Initiate a breach', value: 'BREACH_RECALL_INITIATED' },
  {
    text: 'Initiate a breach and send a letter',
    value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
  },
  { text: 'No further action', value: 'NO_FURTHER_ACTION' },
  { divider: 'or' },
  {
    text: 'I want to add a different action',
    value: 'DIFFERENT_ACTION',
  },
]

const errorMessages: Record<string, string> = {
  [`appointments-${crn}-${contactId}-outcome-updateEnforcementAction`]: error,
}

const appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>> = {
  crn,
  id: contactId,
  uuid: undefined,
  contactId,
  forename,
  appointment: { id: '1', type: '', startDateTime: '' },
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
  sentence: {} as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
  breachOrRecallWarning: null,
  options,
  ticket: null,
  currentEnforcementAction: null,
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
  return cheerio.load(env.render('pages/appointment-outcomes/update-enforcement-action.njk', input))
}

xdescribe('Enforcement action', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('.govuk-back-link').attr('href')).toBe(appointmentOutcome.backLink)
    expect($('main').find('.person-header').length).toBe(1)
    expect($('[data-qa=pageHeading]').text()).toContain(`Update enforcement action for ${forename}’s failure to comply`)
    expect($('.moj-ticket-panel').length).toBe(0)
    expect($('[data-qa="recall-warning"]').length).toBe(0)
    expect($('main').find('.govuk-inset-text').length).toBe(0)
    expect($('main').find('legend').text()).toContain(`Select an action for ${forename}’s failure to comply`)
    const elements = $('.govuk-radios > div')
    expect(elements.length).toBe(6)
    elements.each((index, element) => {
      expect($(element).find('input').attr('checked')).toBeUndefined()
      if ($(element).find('label').length) {
        expect($(element).find('label').text().trim()).toBe(options[index].text)
        if (options[index]?.hint) {
          expect($(element).find('.govuk-hint').text().trim()).toBe(options[index].hint.text)
        }
      } else {
        expect($(element).text().trim()).toBe(options[index].divider)
      }
    })
    expect($('main').find('button').text().trim()).toBe('Continue')
    expect($('[data-qa=cancelGoBackLink]').attr('href')).toBe(
      `/case/${crn}/appointments/appointment/${contactId}/outcome`,
    )
    expect($('[data-qa=cancelGoBackLink]').text().trim()).toBe('Cancel and go back')
  })

  it('should render the page if outcome is acceptable absence', () => {
    const $ = render({
      appointmentOutcome: { appointment: { ...appointmentOutcome.appointment, acceptableAbsence: true } },
    })
    expect($('[data-qa=pageHeading]').text()).toContain(
      `Update enforcement action for ${forename}’s acceptable absence`,
    )
    expect($('main').find('legend').text()).toContain(`Select an action for ${forename}’s acceptable absence`)
  })

  it('should display the current enforcement action', () => {
    const currentEnforcementAction: CurrentEnforcementAction = {
      action: 'REFER_TO_OFFENDER_MANAGER',
      description: 'Refer to offender manager',
      tagColour: 'PURPLE',
    }
    const $ = render({ appointmentOutcome: { currentEnforcementAction } })
    expect($('main').find('.govuk-inset-text').text().trim()).toContain('The current enforcement status is:')
    expect($('main').find('.govuk-inset-text').find('strong').text().trim()).toBe('Refer to offender manager')
    expect($('main').find('.govuk-inset-text').find('strong').hasClass('govuk-tag--purple')).toBe(true)
  })

  it('should display the validation', () => {
    const $ = render({ errorMessages })
    expect($('.govuk-error-summary').find('h2').text().trim()).toEqual('There is a problem')
    expect($('.govuk-error-summary').find('li').length).toBe(1)
    expect($('.govuk-error-summary').find('li').eq(0).find('a').attr('href')).toBe(
      `#appointments-${crn}-${contactId}-outcome-updateEnforcementAction`,
    )
    expect($('.govuk-error-summary').find('li').eq(0).find('a').text().trim()).toBe(error)
    expect($('form').find(`.govuk-form-group--error`).length).toBe(1)
    expect($('form').find('.govuk-error-message').text().trim()).toContain(error)
  })
  it('should persist the selection', () => {
    const session = {
      outcome: {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'REFER_TO_OFFENDER_MANAGER',
        updateEnforcementAction: 'BREACH_RECALL_INITIATED',
      },
    }
    const $ = render({}, session)
    const select = $(`#appointments-${crn}-${contactId}-outcome-otherEnforcementAction`)
    expect($('.govuk-radios').find('.govuk-radios__item').eq(1).find('input').attr('checked')).toBeDefined()
  })
})
