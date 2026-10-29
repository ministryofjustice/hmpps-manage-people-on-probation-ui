import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { AppointmentOutcomeProps, AppResponse, OutcomeSummary } from '../../../models/Locals'
import { Activity } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { Name } from '../../../data/model/personalDetails'

const crn = 'X000001'
const contactId = '1234'
const forename = 'James'
const url = `/case/${crn}/appointments/appointment/${contactId}/outcome/check-your-answers`
const baseOutcomeUrl = `/case/${crn}/appointments/appointment/${contactId}/outcome`
const appointmentDetails = 'Planned office visit (NS) on Wednesday 21 February 2024 at 10:15am to 10:30am'
const nextAppointmentLabel = 'Other call on Wednesday 21 February 2024 at 10:15am to 10:30am'

type Model = {
  appointmentOutcome: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  headerPersonName: Name
  flags: Record<string, boolean>
  url: string
  paths: { current: string }
  csrfToken: string
  nextAppointment?: boolean
  nextAppointmentId?: string
  isInPast?: boolean
}

const summary: OutcomeSummary = {
  appointmentDetails,
  outcome: 'Attended - complied',
  notes: 'Some notes',
  sensitivity: 'Yes',
}

const baseModel: Model = {
  appointmentOutcome: {
    crn,
    id: contactId,
    contactId,
    forename,
    baseOutcomeUrl,
    appointmentSession: {},
    summary,
  },
  headerPersonName: { forename, surname: 'Morrison' },
  flags: { enablePersonHeader: true },
  url,
  paths: { current: url },
  csrfToken: 'csrf-token',
  isInPast: true,
}

const render = (
  model: Partial<Omit<Model, 'appointmentOutcome'>> & {
    appointmentOutcome?: Partial<AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>>
  } = {},
) => {
  const input = {
    ...baseModel,
    ...model,
    appointmentOutcome: { ...baseModel.appointmentOutcome, ...model.appointmentOutcome },
  }
  const req = httpMocks.createRequest({ params: { crn, id: contactId, contactId } })
  const res = httpMocks.createResponse({ locals: input }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/check-your-answers.njk', input))
}

const row = ($: cheerio.CheerioAPI, index: number) => $('.govuk-summary-list__row').eq(index - 1)
const key = ($: cheerio.CheerioAPI, index: number) => row($, index).find('.govuk-summary-list__key').text().trim()
const value = ($: cheerio.CheerioAPI, index: number) => row($, index).find('.govuk-summary-list__value').text().trim()
const changeLink = ($: cheerio.CheerioAPI, index: number) =>
  row($, index).find('.govuk-summary-list__actions a').attr('href')

describe('Check your answers - outcomes', () => {
  it('should render the page heading, summary and submit button', () => {
    const $ = render()
    expect($('main').find('.person-header').length).toBe(1)
    expect($('[data-qa=pageHeading]').text()).toContain('Check your answers then confirm the appointment outcome')
    expect($('[data-qa=pageHeading]').text()).not.toContain('next appointment')
    expect($('form').attr('action')).toBe(url)
    expect($('form').attr('method')).toBe('post')
    expect($('input[name=_csrf]').val()).toBe('csrf-token')
    expect($('[data-qa=submit-btn]').text().trim()).toBe('Confirm this appointment')
  })

  it('should render the rows when outcome has no enforcement action', () => {
    const $ = render()
    expect($('.govuk-summary-list__row').length).toBe(4)
    expect(key($, 1)).toBe('Appointment details')
    expect(value($, 1)).toBe(appointmentDetails)
    expect(row($, 1).find('.govuk-summary-list__actions a').length).toBe(0)
    expect(key($, 2)).toBe('What was the outcome of this appointment?')
    expect(value($, 2)).toBe('Attended - complied')
    expect(key($, 3)).toBe('Notes')
    expect(value($, 3)).toBe('Some notes')
    expect(key($, 4)).toBe('Sensitivity')
    expect(value($, 4)).toBe('Yes')
  })

  it('should render enforcement action and evidence due date', () => {
    const $ = render({
      appointmentOutcome: {
        summary: {
          ...summary,
          outcome: 'Attended - failed to comply',
          enforcementAction: 'I will initiate the breach\nI will send a different enforcement letter',
          evidenceDueDate: '28 February 2024',
          enforcementActionChangeLink: `${baseOutcomeUrl}/enforcement-action`,
        },
      },
    })
    expect($('.govuk-summary-list__row').length).toBe(6)
    expect(key($, 3)).toBe('Enforcement action')
    expect(value($, 3)).toContain('I will initiate the breach')
    expect(value($, 3)).toContain('I will send a different enforcement letter')
    expect(row($, 3).find('.govuk-summary-list__value br').length).toBe(1)
    expect(changeLink($, 3)).toBe(`${baseOutcomeUrl}/enforcement-action?change=${url}`)
    expect(key($, 4)).toBe('Evidence due date')
    expect(value($, 4)).toBe('28 February 2024')
    expect(key($, 5)).toBe('Notes')
    expect(key($, 6)).toBe('Sensitivity')
  })

  it('should render the documents row', () => {
    const $ = render({
      appointmentOutcome: { summary: { ...summary, documents: ['Document-1.pdf', 'Document-2.pdf'] } },
    })
    expect($('.govuk-summary-list__row').length).toBe(5)
    expect(key($, 5)).toBe('Documents')
    expect(value($, 5)).toContain('Document-1.pdf')
    expect(value($, 5)).toContain('Document-2.pdf')
    expect(row($, 5).find('.govuk-summary-list__value br').length).toBe(1)
    expect(changeLink($, 5)).toBe(`${baseOutcomeUrl}/add-note?change=${url}`)
  })

  it('should render the notes placeholder and change link when no notes were entered', () => {
    const $ = render({ appointmentOutcome: { summary: { ...summary, notes: 'No notes' } } })
    expect(key($, 3)).toBe('Notes')
    expect(value($, 3)).toBe('No notes')
    expect(changeLink($, 3)).toBe(`${baseOutcomeUrl}/add-note?change=${url}`)
    expect(key($, 4)).toBe('Sensitivity')
  })

  it('should render the change links', () => {
    const $ = render()
    expect(changeLink($, 2)).toBe(`${baseOutcomeUrl}?change=${url}`)
    expect(row($, 2).find('.govuk-visually-hidden').text()).toContain('outcome of appointment')
    expect(changeLink($, 3)).toBe(`${baseOutcomeUrl}/add-note?change=${url}`)
    expect(row($, 3).find('.govuk-visually-hidden').text()).toContain('notes')
    expect(changeLink($, 4)).toBe(`${baseOutcomeUrl}/add-note?change=${url}`)
    expect(row($, 4).find('.govuk-visually-hidden').text()).toContain('sensitivity')
  })

  it('should not render the sensitivity change link if sensitivity is locked', () => {
    const $ = render({ appointmentOutcome: { appointmentSession: { sensitivityLocked: true } as never } })
    expect(key($, 4)).toBe('Sensitivity')
    expect(row($, 4).find('.govuk-summary-list__actions a').length).toBe(0)
  })

  describe('Next appointment', () => {
    const nextAppointmentSummary = {
      appointmentOutcome: {
        summary: { ...summary, nextAppointment: nextAppointmentLabel },
        nextAppointment: { id: 'next-id', label: nextAppointmentLabel },
      },
    }

    it('should render the next appointment row linking to the next appointment step when no next appointment id', () => {
      const $ = render(nextAppointmentSummary)
      const index = $('.govuk-summary-list__row').length
      expect(key($, index)).toBe('Next appointment')
      expect(value($, index)).toBe(nextAppointmentLabel)
      expect(changeLink($, index)).toBe(`${baseOutcomeUrl}/next-appointment?change=${url}`)
      expect($('[data-qa=submit-btn]').text().trim()).toBe('Confirm this appointment')
    })

    it('should render the arrange appointment heading, button and change link if next appointment is set', () => {
      const $ = render({ ...nextAppointmentSummary, nextAppointment: true, nextAppointmentId: 'next-id' })
      const index = $('.govuk-summary-list__row').length
      expect($('[data-qa=pageHeading]').text()).toContain(
        'Check your answers then confirm the appointment outcome and next appointment',
      )
      expect(key($, index)).toBe('Next appointment')
      expect(changeLink($, index)).toBe(`/case/${crn}/arrange-appointment/next-id/arrange-another-appointment`)
      expect($('[data-qa=submit-btn]').text().trim()).toBe('Confirm appointment outcome and arrange appointment')
    })

    it('should render "No next appointment" if there is no label', () => {
      const $ = render({ appointmentOutcome: { nextAppointment: { label: '' } } })
      const index = $('.govuk-summary-list__row').length
      expect(key($, index)).toBe('Next appointment')
      expect(value($, index)).toBe('No next appointment')
    })
  })
})
