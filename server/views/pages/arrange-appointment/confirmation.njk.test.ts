import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { AppResponse } from '../../../models/Locals'

const crn = 'X000001'
const appointmentId = '4715aa09-0f9d-4c18-948b-a42c45bc0974'

type TestModel = {
  crn: string
  responseContactId: string
  isOutLookEventFailed?: boolean
  isOutlookEventPending?: boolean
  attendingName: string
  linkedAppointment: unknown
  url: string
  isInPast: boolean
  appointmentType: string | null
  smsSent?: boolean
  isEnglishNotificationFailed?: boolean
  isWelshNotificationFailed?: boolean
  appointment: Record<string, unknown>
  case: Record<string, unknown>
  flags: Record<string, unknown>
  contactResponse: { content: unknown[] }
  paths: { current: string }
  csrfToken: string
}

const baseModel: TestModel = {
  crn,
  responseContactId: appointmentId,
  isOutLookEventFailed: false,
  isOutlookEventPending: false,
  attendingName: 'Their',
  linkedAppointment: null,
  url: '',
  isInPast: false,
  appointmentType: null,
  smsSent: false,
  isEnglishNotificationFailed: false,
  isWelshNotificationFailed: false,
  appointment: {
    type: { description: 'Planned office visit (NS)' },
    date: '2025-07-01',
    start: '11:00am',
    end: '12:00pm',
  },
  case: {
    name: { forename: 'Stuart', surname: 'Morrison' },
    mobileNumber: '',
    telephoneNumber: '',
  },
  flags: {
    enableSmsReminders: false,
  },
  contactResponse: { content: [] },
  paths: { current: '/case/X000001/appointments/appointment/4715aa09-0f9d-4c18-948b-a42c45bc0974/manage' },
  csrfToken: 'csrf-token',
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
    appointment: {
      ...baseModel.appointment,
      ...model.appointment,
    },
    case: {
      ...baseModel.case,
      ...model.case,
    },
    flags: {
      ...baseModel.flags,
      ...model.flags,
    },
  }
  const req = httpMocks.createRequest({
    params: { crn, id: appointmentId },
    session: { data: {} },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/confirmation.njk', input))
}

describe('pages/arrange-appointment/confirmation.njk', () => {
  describe('Outlook calendar invitation pending (timeout)', () => {
    it('should display the "may be a problem sending calendar invitation" alert when isOutlookEventPending is true', () => {
      const $ = render({ isOutlookEventPending: true })

      const alert = $('[data-qa="outlook-pending-msg"]')
      expect(alert.length).toBe(1)
      expect(alert.text()).toContain('There may be a problem sending your calendar invitation')
      expect(alert.text()).toContain(
        'You may not receive a calendar invitation. If it does not arrive within a few minutes, create your own calendar event.',
      )
    })

    it('should render a single sentence (not a bulleted list) confirming the NDelius contact log update when isOutlookEventPending is true', () => {
      const $ = render({ isOutlookEventPending: true })

      const message = $('[data-qa="outlook-pending-msg-2"]')
      expect(message.length).toBe(1)
      expect(message.text().replace(/\s+/g, ' ').trim()).toBe(
        'The appointment has been added to the NDelius contact log and officer diary, along with any supporting information.',
      )
      expect($('[data-qa="outlook-msg"]').length).toBe(0)
    })

    it('should reference "updated on" rather than "added to" when the appointment is a reschedule', () => {
      const $ = render({ isOutlookEventPending: true, appointmentType: 'RESCHEDULE' })

      const message = $('[data-qa="outlook-pending-msg-2"]')
      expect(message.text().replace(/\s+/g, ' ').trim()).toBe(
        'The appointment details have been updated on the NDelius contact log and officer diary, along with any supporting information.',
      )
    })

    it('should not display the pending alert or message when isOutlookEventPending is false', () => {
      const $ = render({ isOutlookEventPending: false })

      expect($('[data-qa="outlook-pending-msg"]').length).toBe(0)
      expect($('[data-qa="outlook-pending-msg-2"]').length).toBe(0)
    })

    it('should prioritise the failed message over the pending message when both flags are true', () => {
      const $ = render({ isOutLookEventFailed: true, isOutlookEventPending: true })

      expect($('[data-qa="outlook-err-msg-1"]').length).toBe(1)
      expect($('[data-qa="outlook-pending-msg"]').length).toBe(0)
      expect($('[data-qa="outlook-pending-msg-2"]').length).toBe(0)
    })

    it('should not display the pending alert for past appointments', () => {
      const $ = render({ isOutlookEventPending: true, isInPast: true })

      expect($('[data-qa="outlook-pending-msg"]').length).toBe(0)
    })
  })

  describe('Outlook calendar invitation successful', () => {
    it('should render the calendar and NDelius bullet list when neither failed nor pending', () => {
      const $ = render({ isOutLookEventFailed: false, isOutlookEventPending: false })

      const list = $('[data-qa="outlook-msg"]')
      expect(list.length).toBe(1)
      expect(list.text()).toContain('Their calendar')
      expect(list.text()).toContain('the NDelius contact log and officer diary, along with any supporting information')
    })
  })
})
