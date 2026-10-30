import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { AppointmentOutcomeProps, AppointmentOutcomeSentence, AppResponse } from '../../../models/Locals'
import { Activity } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { Name } from '../../../data/model/personalDetails'

const crn = 'X000001'
const contactId = '1234'
const page = 'enforcement-action'
const forename = 'James'

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
  sentence: {} as AppointmentOutcomeSentence,
  backLink: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
  breachOrRecallWarning: null,
  ticket: null,
  currentEnforcementAction: null,
  confirmation: {
    actions: [
      { text: 'arrange another appointment', href: '/action/url/1', external: false },
      { text: 'log outcomes for 2 appointments', href: '/action/url/2', external: false },
      { text: 'use the Consider a recall service', href: '/action/url/3', external: true },
    ],
    title: 'Appointment outcome updated',
    type: 'Planned office visit (NS)',
    date: 'Wednesday 21 October 2026 from 9am to 10am',
    text: ['This outcome has been saved against the appointment on NDelius.'],
  },
}

type TestModel = {
  nextAppointmentId: string
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  headerPersonName: Name
  errorMessages?: Record<string, string>
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  nextAppointmentId: '',
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
  return cheerio.load(env.render('pages/appointment-outcomes/confirmation.njk', input))
}

describe('Confirmation', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('main').find('.person-header').length).toBe(1)
    expect($('[data-qa=pageHeading]').text().trim()).toBe(`Appointment outcome updated`)
    expect($('main').find('.govuk-panel').find('strong').text().trim()).toBe('Planned office visit (NS)')
    expect($('main').find('.govuk-panel').find('[data-qa=appointmentDate]').text().trim()).toBe(
      'Wednesday 21 October 2026 from 9am to 10am',
    )
    const whatHappensNext = $('main').find('[data-qa="what-happens-next"]')
    expect(whatHappensNext.find('h2').text().trim()).toBe('What happens next')
    expect(whatHappensNext.find('p').text().trim()).toBe(
      'This outcome has been saved against the appointment on NDelius.',
    )
    const furtherActions = $('main').find('[data-qa="further-actions"]')
    expect(furtherActions.find('h2').text().trim()).toBe('Further actions')
    expect(furtherActions.find('p').eq(0).text().trim()).toBe('You can:')
    expect(furtherActions.find('li').length).toBe(3)
    expect(furtherActions.find('li').eq(0).find('a').text().trim()).toBe('arrange another appointment')
    expect(furtherActions.find('li').eq(0).find('a').attr('href')).toBe('/action/url/1')
    expect(furtherActions.find('li').eq(1).find('a').text().trim()).toBe('log outcomes for 2 appointments')
    expect(furtherActions.find('li').eq(1).find('a').attr('href')).toBe('/action/url/2')
    expect(furtherActions.find('li').eq(2).find('a').text().trim()).toBe('use the Consider a recall service')
    expect(furtherActions.find('li').eq(2).find('a').attr('href')).toBe('/action/url/3')
    expect(furtherActions.find('li').eq(2).find('a').attr('target')).toBe('_blank')
    expect($('main').find('[data-qa="submit-btn"]').text().trim()).toBe('Return to James’s overview')
    expect($('main').find('[data-qa=returnToManageAppointment]').text().trim()).toBe('Return to manage appointment')
    expect($('main').find('[data-qa=returnToManageAppointment]').attr('href')).toBe(
      `/case/${crn}/appointments/appointment/${contactId}/manage`,
    )
  })
  it('should render the page if next appointment arranged', () => {
    const $ = render({ nextAppointmentId: '123' })
    expect($('main').find('.govuk-panel').find('strong').length).toBe(0)
    expect($('main').find('.govuk-panel').find('[data-qa=appointmentDate]').length).toBe(0)
    const whatHappensNext = $('main').find('[data-qa="what-happens-next"]')
    expect(whatHappensNext.find('p').eq(1).text().trim()).toEqual('The new appointment has been added to:')
    expect(whatHappensNext.find('li').eq(0).text().trim()).toEqual('your calendar')
    expect(whatHappensNext.find('li').eq(1).text().trim()).toEqual(
      'the NDelius contact log and officer diary, along with any supporting information',
    )
  })
})
