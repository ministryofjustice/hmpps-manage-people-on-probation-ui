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
  appointmentOutcome?: {
    baseOutcomeUrl: string
    summary: {
      outcome?: string
      enforcementAction?: string
      enforcementActionChangeLink?: string
      evidenceDueDate?: string
    }
  }
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

    it('should link each row to the relevant change page', () => {
      const $ = render()
      const base = `/case/${crn}/arrange-appointment/${id}`
      expect(action($, 1).attr('href')).toBe(`${base}/sentence?change=`)
      expect(action($, 2).attr('href')).toBe(`${base}/type-attendance?change=`)
      expect(action($, 3).attr('href')).toBe(`${base}/attendance?change=`)
      expect(action($, 4).attr('href')).toBe(`${base}/location-date-time?change=`)
      expect(action($, 5).attr('href')).toBe(`${base}/location-date-time?change=`)
      expect(action($, 6).attr('href')).toBe(`${base}/supporting-information?change=`)
      expect(action($, 7).attr('href')).toBe(`${base}/supporting-information?change=`)
      expect(action($, 5).text()).toContain('Choose date and time')
      expect(action($, 7).text()).toContain('Choose sensitivity')
    })

    it('should display updated date, time, notes and sensitivity', () => {
      const $ = render({
        appointment: appointment({
          date: '2030-03-05',
          start: '09:30',
          end: '10:30',
          notes: 'Some updated notes',
          sensitivity: 'No',
        }),
      })
      expect(value($, 5).text()).toContain('5 March 2030')
      expect(value($, 5).text()).toContain('9:30am to 10:30am')
      expect(action($, 5).text()).toContain('Change')
      expect(value($, 6).text()).toContain('Some updated notes')
      expect(value($, 7).text()).toContain('No')
      expect(action($, 7).text()).toContain('Change')
    })

    describe('appointment in the past', () => {
      const $ = render({
        isInPast: true,
        appointment: appointment({
          date: '2020-03-05',
          start: '09:30',
          end: '10:30',
          notes: 'Some updated notes',
          sensitivity: 'No',
        }),
        appointmentOutcome: {
          baseOutcomeUrl: '/outcome-base',
          summary: {
            outcome: 'Attended - failed to comply',
            enforcementAction: 'No further action',
            enforcementActionChangeLink: '/enforcement-change',
            evidenceDueDate: '11 March 2020',
          },
        },
      })

      it('should display the outcome, enforcement action and evidence due date', () => {
        expect(row($, 6).find('.govuk-summary-list__key').text()).toContain('What was the outcome of this appointment?')
        expect(value($, 6).text()).toContain('Attended - failed to comply')
        expect(action($, 6).attr('href')).toBe('/outcome-base?change=')
        expect(row($, 7).find('.govuk-summary-list__key').text()).toContain('Enforcement action')
        expect(value($, 7).text()).toContain('No further action')
        expect(row($, 8).find('.govuk-summary-list__key').text()).toContain('Evidence due date')
        expect(value($, 8).text()).toContain('11 March 2020')
      })
      it('should label the notes row "Notes" and link to the add note page', () => {
        expect(row($, 9).find('.govuk-summary-list__key').text()).toContain('Notes')
        expect(value($, 9).text()).toContain('Some updated notes')
        expect(action($, 9).attr('href')).toBe('/outcome-base/add-note?change=')
        expect(row($, 10).find('.govuk-summary-list__key').text()).toContain('Sensitivity')
        expect(action($, 10).attr('href')).toBe('/outcome-base/add-note?change=')
      })
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
