import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentOutcomeType, AppointmentSessionOutcome } from '../../models/Appointments'
import { AppResponse } from '../../models/Locals'
import { getConfirmation } from './getConfirmation'
import { ContactResponse } from '../../data/model/overdueOutcomes'

const crn = 'X000001'
const id = '12345'
const type = 'Planned Office Visit (NS)'
const url = `/case/${crn}/appointments/appointment/${id}/outcome/confirmation`

const contactResponse: ContactResponse = {
  content: [
    {
      id: 5,
      type: {
        code: 'DGTSLC',
        description: 'Phone call',
      },
      date: '2026-03-21',
      start: '10:15:00',
      end: '10:30:00',
    },
    {
      id: 6,
      type: {
        code: 'AL003',
        description: 'Other call',
      },
      date: '2025-02-21',
      start: '10:15:00',
      end: '10:30:00',
    },
  ],
}
const buildResponse = ({
  outcome = {},
  locals = {},
}: { outcome?: AppointmentSessionOutcome; locals?: Record<string, any> } = {}): AppResponse => {
  const response = {
    appointmentOutcome: {
      crn,
      id,
      appointment: {
        startDateTime: '2025-12-22T09:15:00.382936Z[Europe/London]',
        endDateTime: '2025-12-22T09:30:00.382936Z[Europe/London]',
        type,
      },
      sentence: {
        type: 'CUSTODY',
      },
      appointmentSession: {
        date: '2025-12-22',
        start: '09:15',
        end: '09:30',
        outcome,
      },
    },
    contactResponse,
    ...locals,
  }
  return mockAppResponse(response)
}

const req = httpMocks.createRequest({ url })

const nextSpy = jest.fn()

describe('/middleware/appointment-outcomes/getConfirmation', () => {
  describe('Outcome is attended and complied, attended but sent home due to Probation Service issues or acceptable absence', () => {
    const outcomes: AppointmentOutcomeType[] = [
      'ATTENDED_COMPLIED',
      'ATTENDED_SENT_HOME_SERVICE_ISSUES',
      'ACCEPTABLE_ABSENCE',
    ]
    outcomes.forEach(outcomeType => {
      it(`should set the correct confirmation values if outcome logged is ${outcomeType}`, () => {
        const outcome = { outcomeType }
        const res = buildResponse({ outcome })
        getConfirmation(req, res, nextSpy)
        expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
          title: 'Appointment outcome updated',
          text: ['This outcome has been saved against the appointment on NDelius.'],
          type,
          date: 'Monday 22 December 2025 from 9:15am to 9:30am',
          actions: [
            {
              text: 'arrange another appointment',
              href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
            },
            {
              text: `log outcomes for ${contactResponse.content.length} appointments`,
              href: `/case/${crn}/record-an-outcome/outcome`,
            },
          ],
        })
      })
    })
  })
  describe('Enforcement action is letter sent by case admin', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        letterType: 'SECOND_WARNING_LETTER_SENT',
        letterSentBy: 'CASE_ADMIN',
      }
      const locals = { contactResponse: { content: [contactResponse.content[0]] as any } }
      const res = buildResponse({ outcome, locals })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Enforcement outcome added',
        text: [
          'This enforcement outcome has been added to the NDelius Enforcement Diary.',
          'Follow your local process to request a second warning letter.',
        ],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'use the Consider a recall service',
            href: 'https://sign-in.hmpps.service.justice.gov.uk/auth/sign-in?redirect_uri=https://consider-a-recall.hmpps.service.justice.gov.uk/sign-in/callback',
            external: true,
          },
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log appointment outcome for Saturday 21 March 2026`,
            href: `/case/${crn}/appointments/appointment/5/manage`,
          },
        ],
      })
    })
  })
  describe('Enforcement action is letter sent by PP', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        letterType: 'SECOND_WARNING_LETTER_SENT',
        letterSentBy: 'USER',
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Enforcement outcome added',
        text: [
          'This enforcement outcome has been added to the NDelius Enforcement Diary.',
          'Your case administrator or you will create and send a second warning letter.',
        ],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [],
      })
    })
  })

  describe('Action is breach and does not a letter and does not get added to the NDelius enforcement diary', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        outcomeType: 'ATTENDED_SENT_HOME_BEHAVIOUR',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED',
        breachNSICreatedBy: 'CASE_ADMIN',
        enforcementActionCode: ['IBR'],
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Enforcement outcome added',
        text: [
          'This outcome has been saved against the appointment on NDelius.',
          'Liase with your case administrator to create a breach/recall NSI on NDelius.',
        ],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log outcomes for ${contactResponse.content.length} appointments`,
            href: `/case/${crn}/record-an-outcome/outcome`,
          },
        ],
      })
    })
  })

  describe('Action is not a letter and does get added to the NDelius enforcement diary', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'REFER_TO_OFFENDER_MANAGER',
        enforcementActionCode: ['ROM'],
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Enforcement outcome added',
        text: ['This enforcement outcome has been added to the NDelius Enforcement Diary.'],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log outcomes for ${contactResponse.content.length} appointments`,
            href: `/case/${crn}/record-an-outcome/outcome`,
          },
        ],
      })
    })
  })

  describe('Outcome is unacceptable absence and action is not letter related', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'BREACH_RECALL_INITIATED',
        breachNSICreatedBy: 'CASE_ADMIN',
        enforcementActionCode: ['IBR'],
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Unacceptable absence outcome added',
        text: ['This outcome has been saved against the appointment on NDelius.'],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log outcomes for ${contactResponse.content.length} appointments`,
            href: `/case/${crn}/record-an-outcome/outcome`,
          },
        ],
      })
    })
  })

  describe('Outcome is unacceptable absence and action is letter related', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        breachNSICreatedBy: 'CASE_ADMIN',
        letterSentBy: 'CASE_ADMIN',
        letterType: 'FIRST_WARNING_LETTER_SENT',
        enforcementActionCode: ['IBR', 'EA02'],
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'Enforcement outcome added',
        text: [
          'This enforcement outcome has been added to the NDelius Enforcement Diary.',
          'Follow your local process to request a first warning letter.',
        ],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'use the Consider a recall service',
            href: 'https://sign-in.hmpps.service.justice.gov.uk/auth/sign-in?redirect_uri=https://consider-a-recall.hmpps.service.justice.gov.uk/sign-in/callback',
            external: true,
          },
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log outcomes for ${contactResponse.content.length} appointments`,
            href: `/case/${crn}/record-an-outcome/outcome`,
          },
        ],
      })
    })
  })

  describe('Enforcement action is no further action', () => {
    it('should set the correct confirmation values', () => {
      const outcome: AppointmentSessionOutcome = {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'NO_FURTHER_ACTION',
      }
      const res = buildResponse({ outcome })
      getConfirmation(req, res, nextSpy)
      expect(res.locals.appointmentOutcome.confirmation).toStrictEqual({
        title: 'No further action outcome added',
        text: ['This outcome has been saved against the appointment on NDelius.'],
        type,
        date: 'Monday 22 December 2025 from 9:15am to 9:30am',
        actions: [
          {
            text: 'arrange another appointment',
            href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(url)}`,
          },
          {
            text: `log outcomes for ${contactResponse.content.length} appointments`,
            href: `/case/${crn}/record-an-outcome/outcome`,
          },
        ],
      })
    })
  })
})
