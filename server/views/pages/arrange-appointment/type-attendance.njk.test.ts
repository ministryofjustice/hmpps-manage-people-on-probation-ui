import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { Name } from '../../../data/deliusClient'
import { AppointmentSession, AppointmentType } from '../../../models/Appointments'
import { AppointmentLocals, AppResponse } from '../../../models/Locals'
import { Sentence } from '../../../data/model/sentenceDetails'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { RiskFlag } from '../../../data/model/risk'
import { toSentenceCase } from '../../../utils'

const crn = 'X000001'
const id = 'a958eb95-1e59-407e-a217-5d7589ab46f5'

const appointment: Partial<AppointmentLocals> = {
  meta: {
    isVisor: true,
    forename: 'Caroline',
    change: null,
    userIsAttending: false,
    hasLocation: null,
  },
  attending: {
    name: 'Mpop Testuser (PS - PSO)',
    team: 'Automated Allocation Team',
    region: 'London',
    html: 'Mpop Testuser (PS - PSO) (Automated Allocation Team)',
  },
}
const appointmentTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COPT',
    description: 'Planned Telephone Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: false,
  },
  {
    code: 'COVC',
    description: 'Planned Video Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
]

const riskToProbationStaff: Partial<RiskFlag> = {
  id: 1,
  description: 'risk to probation staff',
}

type TestModel = {
  crn: string
  id: string
  appointmentTypes: AppointmentType[]
  appointment: Partial<AppointmentLocals>
  allSentences: Sentence[]
  headerPersonName: Name
  headerCRN: string
  riskToProbationStaff: Partial<RiskFlag>
  errorMessages: Record<string, string>
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  crn,
  id,
  appointmentTypes,
  appointment,
  allSentences: [],
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  riskToProbationStaff: null,
  headerCRN: crn,
  errorMessages: null,
  flags: {
    enablePersonHeader: true,
  },
}

const render = (model = {} as Partial<TestModel>, session = {}) => {
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
        personalDetails: {
          [crn]: {
            allowSms: true,
          },
        },
      },
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/type-attendance.njk', input))
}

describe('Type and attendance page', () => {
  it('should render the page', () => {
    const $ = render()
    const type = $('main').find('[data-qa=type]')
    const attendee = $('main').find('[data-qa=attendee]')
    const typeRadioItems = type.find('.govuk-radios__item')
    const visor = $('main').find('[data-qa=visorReport]')
    expect($('body').find('.govuk-back-link').attr('href')).toBe(`/case/${crn}/arrange-appointment/${id}/sentence`)
    expect($('body').find('.person-header').length).toBe(1)
    expect($('[data-qa="pageHeading"]').text().trim()).toBe('Appointment type and attendance')
    expect($('main').find('.moj-alert').length).toBe(0)
    const inset = $('main').find('.govuk-inset-text')
    expect(inset.find('a').text().trim()).toBe('NDelius (opens in new tab)')
    expect(inset.find('a').attr('target')).toBe('_blank')
    expect(inset.find('a').attr('href')).toBe(
      `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=${crn}`,
    )
    expect(inset.find('li').eq(0).text().trim()).toBe('any other type of appointment not listed below')
    expect(inset.find('li').eq(1).text().trim()).toBe('appointments that require document templates')
    expect(inset.find('li').eq(2).text().trim()).toBe(
      'appointments for RAR toolkits or NSIs (non-statutory interventions)',
    )
    expect(type.find('legend').text().trim()).toBe('What appointment are you arranging?')
    typeRadioItems.each((i, radioItem) => {
      expect($(radioItem).find('label').text().trim()).toBe(toSentenceCase(appointmentTypes[i].description))
      expect($(radioItem).find('input:checked').length).toBe(0)
    })
    expect(attendee.find('h2').text().trim()).toBe('Who will attend the appointment?')
    expect(attendee.find('p').eq(0).text().trim()).toBe('You can attend or book for someone else')
    expect(attendee.find('[data-qa=attendeeDetails]').text().trim()).toBe(
      'Mpop Testuser (PS - PSO) (Automated Allocation Team, London)',
    )
    expect(attendee.find('[data-qa=changeAttendeeLink]').text().trim()).toBe('Change')
    expect(attendee.find('[data-qa=changeAttendeeLink]').attr('href')).toBe(
      `/case/${crn}/arrange-appointment/${id}/attendance`,
    )
    const visorRadioItems = visor.find('.govuk-radios__item')
    expect(visor.find('legend').text().trim()).toBe('Include appointment in ViSOR report?')
    expect(visor.find('.govuk-hint').text().trim()).toBe(
      'This will add the appointment to the NDelius ViSOR report. It must still be added manually to the ViSOR secure national database.',
    )
    expect(visorRadioItems.eq(0).find('label').text().trim()).toBe('Yes')
    expect(visorRadioItems.eq(0).find('input:checked').length).toBe(0)
    expect(visorRadioItems.eq(1).find('label').text().trim()).toBe('No')
    expect(visorRadioItems.eq(1).find('input:checked').length).toBe(0)
    expect($('main').find('button').text().trim()).toBe('Continue')
  })
  it('should render the page with risk banner', () => {
    const $ = render({ riskToProbationStaff })
    expect($('main').find('.moj-alert').find('h2').text().trim()).toBe('Caroline is a risk to probation staff')
  })
  it('should not display the visor report question', () => {
    const $ = render({ appointment: { ...appointment, meta: { ...appointment.meta, isVisor: false } } })
    expect($('main').find('[data-qa=visorReport]').length).toBe(0)
  })
  it('should display the validation', () => {
    const errorMessages: Record<string, string> = {
      [`appointments-${crn}-${id}-type`]: 'Select an appointment type',
      [`appointments-${crn}-${id}-visorReport`]: 'Select if appointment should be included in VISOR report',
    }
    const $ = render({ errorMessages })
    const type = $('main').find('[data-qa=type]')
    const visor = $('main').find('[data-qa=visorReport]')
    expect($('.govuk-error-summary').find('h2').text().trim()).toEqual('There is a problem')
    expect($('.govuk-error-summary').find('li').length).toBe(2)
    expect($('.govuk-error-summary').find('li').eq(0).find('a').attr('href')).toBe(`#appointments-${crn}-${id}-type`)
    expect($('.govuk-error-summary').find('li').eq(1).find('a').attr('href')).toBe(
      `#appointments-${crn}-${id}-visorReport`,
    )
    expect(type.hasClass('govuk-form-group--error')).toBe(true)
    expect(type.find('.govuk-error-message').text()).toContain('Select an appointment type')
    expect(visor.hasClass('govuk-form-group--error')).toBe(true)
    expect(visor.find('.govuk-error-message').text()).toContain(
      'Select if appointment should be included in VISOR report',
    )
  })
  it('should persist type and visor selections', () => {
    const session: Partial<AppointmentSession> = {
      type: 'COPT',
      visorReport: 'No',
    }
    const $ = render({}, session)
    const type = $('main').find('[data-qa=type]')
    const visor = $('main').find('[data-qa=visorReport]')
    expect(type.find('.govuk-radios__item').eq(1).find('input').attr('checked')).toBeDefined()
    expect(visor.find('.govuk-radios__item').eq(1).find('input').attr('checked')).toBeDefined()
  })
})
