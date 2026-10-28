import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { AppointmentLocals, AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

const terryJones = {
  name: 'Terry Jones (PS-PSO)',
  team: 'Automated Allocation Team',
  region: 'London',
  html: 'Terry Jones (PS-PSO) (Automated Allocation Team, London)',
}

const location = {
  id: 1234,
  code: 'N56NTMC',
  description: 'HMP Wakefield',
  address: {
    buildingName: 'The Building',
    buildingNumber: '77',
    streetName: 'Some Street',
    district: 'Some City Centre',
    town: 'London',
    county: 'Essex',
    postcode: 'NW10 1EP',
  },
}

const appointment = (overrides: Record<string, unknown> = {}): AppointmentLocals =>
  ({
    meta: { isVisor: false, forename: 'Caroline', change: null, userIsAttending: false, hasLocation: true },
    type: {
      code: 'COAP',
      description: 'Planned Office Visit (NS)',
      isPersonLevelContact: false,
      isLocationRequired: true,
    },
    appointmentFor: { sentence: 'Default Sentence Type (12 Months)' },
    attending: terryJones,
    location,
    date: '',
    start: '',
    end: '',
    notes: null,
    sensitivity: null,
    ...overrides,
  }) as unknown as AppointmentLocals

type TestModel = {
  appointment: AppointmentLocals
  isInPast: boolean | null
  nextAppointmentId?: string
}

const render = ({ nextAppointmentId, ...model }: Partial<TestModel> = {}) => {
  const input: Record<string, unknown> = {
    appointment: appointment(),
    isInPast: null,
    crn,
    id,
    url: '',
    flags: {},
    nextAppointmentId,
    ...model,
  }
  const req = httpMocks.createRequest({ params: { crn, id } })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/arrange-another-appointment.njk', input))
}

const row = ($: cheerio.CheerioAPI, index: number) => $(`.govuk-summary-list__row:nth-child(${index})`)
const value = ($: cheerio.CheerioAPI, index: number) => row($, index).find('.govuk-summary-list__value')
const action = ($: cheerio.CheerioAPI, index: number) => row($, index).find('.govuk-summary-list__actions a')

describe('Arrange another appointment page', () => {
  describe('page content', () => {
    it('should display the heading and guidance', () => {
      const $ = render()
      expect($('[data-qa=pageHeading]').text()).toBe('Arrange another appointment')
      expect($('p.govuk-body').text()).toContain('Use the saved details of your recently created appointment')
    })

    it('should display "Arrange appointment" on the button by default', () => {
      const $ = render()
      expect($('[data-qa=submit-btn]').text()).toContain('Arrange appointment')
    })

    it('should display "Continue" on the button when part of the outcome journey', () => {
      const $ = render({ nextAppointmentId: id })
      expect($('[data-qa=submit-btn]').text()).toContain('Continue')
    })

    test.each`
      isInPast | expectedCount
      ${null}  | ${0}
      ${true}  | ${0}
      ${false} | ${1}
    `('should show $expectedCount calendar invite inset when isInPast is $isInPast', ({ isInPast, expectedCount }) => {
      const $ = render({ isInPast })
      expect($('[data-qa=calendarInviteInset]')).toHaveLength(expectedCount)
    })
  })

  describe('summary list', () => {
    it('should display the keys with no date or notes entered for a complete appointment', () => {
      const $ = render()
      expect(row($, 1).find('.govuk-summary-list__key').text()).toContain('Appointment for')
      expect(value($, 1).text()).toContain('Default Sentence Type (12 Months)')
      expect(row($, 2).find('.govuk-summary-list__key').text()).toContain('Appointment type')
      expect(value($, 2).text()).toContain('Planned office visit (NS)')
      expect(row($, 3).find('.govuk-summary-list__key').text()).toContain('Attending')
      expect(value($, 3).text()).toContain('Terry Jones (PS-PSO) (Automated Allocation Team, London)')
      expect(row($, 4).find('.govuk-summary-list__key').text()).toContain('Location')
      expect(row($, 5).find('.govuk-summary-list__key').text()).toContain('Date and time')
      expect(value($, 5).text()).toContain('Not entered')
      expect(row($, 6).find('.govuk-summary-list__key').text()).toContain('Supporting information')
      expect(value($, 6).text()).toContain('Not entered')
      expect(row($, 7).find('.govuk-summary-list__key').text()).toContain('Sensitivity')
      expect(value($, 7).text()).toContain('Not entered')
    })

    describe('sentence appointment with no eventId', () => {
      const $ = render({ appointment: appointment({ appointmentFor: {}, type: undefined, location: undefined }) })

      it('should prompt to choose what the appointment is for', () => {
        expect(value($, 1).text()).toContain('Not entered')
        expect(action($, 1).text()).toContain('Choose for')
      })
      it('should show a hint and no action for the type', () => {
        expect(value($, 2).text()).toContain('Not entered')
        expect(value($, 2).text()).toContain('Select what the appointment is for first.')
        expect(row($, 2).find('.govuk-summary-list__actions')).toHaveLength(0)
      })
      it('should still display the attending officer with a change link', () => {
        expect(value($, 3).text()).toContain('Terry Jones (PS-PSO) (Automated Allocation Team, London)')
        expect(action($, 3).text()).toContain('Change')
      })
      it('should show a hint and no action for the location', () => {
        expect(value($, 4).text()).toContain('Not entered')
        expect(value($, 4).text()).toContain('Select what the appointment is for first.')
        expect(row($, 4).find('.govuk-summary-list__actions')).toHaveLength(0)
      })
    })

    describe('appointment with no type', () => {
      const $ = render({ appointment: appointment({ type: undefined, location: undefined }) })

      it('should display the sentence with a change link', () => {
        expect(value($, 1).text()).toContain('Default Sentence Type (12 Months)')
        expect(action($, 1).text()).toContain('Change')
      })
      it('should prompt to choose the type without a hint', () => {
        expect(value($, 2).text()).toContain('Not entered')
        expect(value($, 2).html()).not.toContain('<span class="govuk-summary-list__hint">')
        expect(action($, 2).text()).toContain('Choose type')
      })
      it('should display the attending officer with a change link', () => {
        expect(value($, 3).text()).toContain('Terry Jones (PS-PSO) (Automated Allocation Team, London)')
        expect(action($, 3).text()).toContain('Change')
      })
      it('should show the type hint and no action for the location', () => {
        expect(value($, 4).text()).toContain('Not entered')
        expect(value($, 4).text()).toContain('Select the appointment type first.')
        expect(row($, 4).find('.govuk-summary-list__actions')).toHaveLength(0)
      })
    })

    describe('appointment with no location', () => {
      const $ = render({
        appointment: appointment({
          type: {
            code: 'COAP',
            description: '3 way meeting (NS)',
            isPersonLevelContact: false,
            isLocationRequired: true,
          },
          attending: {
            ...terryJones,
            html: 'Peter Parker (PS-PSO) (Automated Allocation Team, London)',
            name: 'Peter Parker (PS-PSO)',
          },
          location: undefined,
        }),
      })

      it('should display the sentence, type and attending with change links', () => {
        expect(value($, 1).text()).toContain('Default Sentence Type (12 Months)')
        expect(action($, 1).text()).toContain('Change')
        expect(value($, 2).text()).toContain('3 way meeting (NS)')
        expect(action($, 2).text()).toContain('Change')
        expect(value($, 3).text()).toContain('Peter Parker (PS-PSO) (Automated Allocation Team, London)')
        expect(action($, 3).text()).toContain('Change')
      })
      it('should prompt to choose the location', () => {
        expect(value($, 4).text()).toContain('Not entered')
        expect(action($, 4).text()).toContain('Choose location')
      })
    })

    describe('person level appointment', () => {
      const $ = render({
        appointment: appointment({
          appointmentFor: { forename: 'Caroline' },
          type: {
            code: 'COAP',
            description: 'Planned doorstep contact (NS)',
            isPersonLevelContact: true,
            isLocationRequired: true,
          },
        }),
      })

      it('should display the person, type and attending with change links', () => {
        expect(value($, 1).text()).toContain('Caroline')
        expect(action($, 1).text()).toContain('Change')
        expect(value($, 2).text()).toContain('Planned doorstep contact (NS)')
        expect(action($, 2).text()).toContain('Change')
        expect(value($, 3).text()).toContain('Terry Jones (PS-PSO) (Automated Allocation Team, London)')
        expect(action($, 3).text()).toContain('Change')
      })
      it('should display the location address on separate lines with a change link', () => {
        expect(value($, 4).html()).toContain('HMP Wakefield<br>')
        expect(value($, 4).html()).toContain('<br>London<br>Essex<br>NW10 1EP')
        expect(action($, 4).text()).toContain('Change')
      })
    })
  })
})
