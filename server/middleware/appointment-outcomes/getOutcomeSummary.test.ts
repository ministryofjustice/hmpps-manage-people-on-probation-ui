import httpMocks from 'node-mocks-http'
import { getOutcomeSummary } from './getOutcomeSummary'
import { mockAppResponse } from '../../controllers/mocks'
import { AppointmentOutcomeProps, OutcomeSummary, type AppResponse } from '../../models/Locals'
import { Activity, ContactEnforcementAction, ContactOutcome } from '../../data/model/schedule'
import { AppointmentSessionOutcome } from '../../models/Appointments'
import { Compliance } from '../../data/model/overview'

const crn = 'X000001'
const contactId = '12345'

const req = httpMocks.createRequest()

const mockAppointment = ({ appointment = {} } = {}): Activity => ({
  id: '123',
  type: 'Planned Office Visit (NS)',
  startDateTime: '2026-05-15T12:00:00.000[Europe/London]',
  endDateTime: '2026-05-15T13:30:00.000[Europe/London]',
  ...appointment,
})

const expectedAppointmentDetails = 'Planned office visit (NS) on Friday 15 May 2026 at 12pm to 1:30pm'

const mockEnforcementActions: ContactEnforcementAction[] = [
  {
    code: 'NFA',
    description: 'No Further Action',
  },
  {
    code: 'IBR',
    description: 'Breach / Recall Initiated',
  },
  {
    code: 'EA02',
    description: 'First Warning Letter Sent',
    defaultResponsePeriodDays: 7,
  },
]

const mockContactOutcomes: ContactOutcome[] = [
  {
    code: 'ATTC',
    description: 'Attended - Complied',
    enforcementActions: [],
  },
  {
    code: 'AFTC',
    description: 'Attended - Failed To Comply',
    enforcementActions: mockEnforcementActions,
  },
  {
    code: 'AFTA',
    description: 'Failed To Attend',
    enforcementActions: mockEnforcementActions,
  },
  { code: 'AAHO', description: 'Acceptable Absence - Holiday', enforcementActions: [] },
  { code: 'AAME', description: 'Acceptable Absence - Medical', enforcementActions: [] },
]

const mockAppointmentOutcome = ({
  outcome = {},
  notes = 'Some notes',
  appointment = mockAppointment(),
}: {
  outcome?: AppointmentSessionOutcome
  notes?: string
  appointment?: Activity
} = {}): AppointmentOutcomeProps<Activity> => ({
  sentence: {
    type: 'COMMUNITY',
    length: 12,
    eventId: 123,
    order: '',
    youth: false,
    pss: false,
    compliance: {} as Compliance,
  },
  forename: 'James',
  surname: 'Morrison',
  crn,
  uuid: undefined,
  contactId,
  id: contactId,
  isInPast: true,
  isValidParams: true,
  documents: [],
  reqUrl: '/req/url',
  baseUrl: '/base/url',
  baseOutcomeUrl: '/base/outcome/url',
  completedUrl: '/completed/url',
  notePrepend: 'Mock note prepend',
  showLetterTypeOptions: false,
  appointmentSession: {
    notes,
    sensitivity: 'No',
    date: '2026-05-15',
    outcome: {
      outcomeType: 'ATTENDED_COMPLIED',
      outcomeCode: 'ATTC',
      enforcementActionCode: [],
      contactOutcomes: mockContactOutcomes,
      attendedFailedToComply: null,
      acceptableAbsence: null,
      unacceptableAbsence: null,
      failedToAttend: null,
      letterSentBy: null,
      letterType: null,
      breachNSICreatedBy: null,
      ...outcome,
    },
  },
  appointment,
})

const buildResponse = ({
  appointment = mockAppointment(),
  nextAppointment = null as any,
  outcome = {},
  notes = 'Some notes',
}: {
  appointment?: Activity
  nextAppointment?: Activity
  outcome?: Partial<AppointmentSessionOutcome>
  notes?: string
} = {}): AppResponse => {
  const locals = {
    appointmentOutcome: mockAppointmentOutcome({ outcome, notes, appointment }),
    nextAppointment: {
      appointment: nextAppointment,
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/getOutcomeSummary', () => {
  it('should create the correct summary if only an outcome has been selected', () => {
    const res = buildResponse()
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Attended - complied',
      notes: 'Some notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: 'No next appointment',
      documents: null,
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })

  it('should create the correct summary if an outcome and action have been selected with no evidence due date', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      attendedFailedToComply: 'NO_FURTHER_ACTION',
      enforcementActionCode: ['NFA'],
    }
    const res = buildResponse({ outcome })
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Attended - failed to comply',
      enforcementAction: 'No further action',
      enforcementActionChangeLink: '/base/outcome/url/attended-failed-to-comply',
      notes: 'Some notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: 'No next appointment',
      documents: null,
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })

  it('should create the correct summary if an outcome and breach/recall action have been selected', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED',
      breachNSICreatedBy: 'CASE_ADMIN',
      enforcementActionCode: ['IBR'],
    }
    const res = buildResponse({ outcome })
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Attended - failed to comply',
      enforcementAction: mockAppointmentOutcome().notePrepend,
      enforcementActionChangeLink: '/base/outcome/url/attended-failed-to-comply',
      notes: 'Some notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: 'No next appointment',
      documents: null,
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })

  it('should create the correct summary if an outcome and breach/recall and send letter action have been selected', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
      outcomeCode: 'AFTC',
      attendedFailedToComply: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      breachNSICreatedBy: 'CASE_ADMIN',
      letterSentBy: 'CASE_ADMIN',
      letterType: 'BREACH_LETTER_SENT',
      enforcementActionCode: ['IBR', 'EA08'],
      contactOutcomes: [
        {
          code: 'AFTC',
          description: 'Attended - Failed To Comply',
          enforcementActions: [
            { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
            { code: 'EA08', description: 'Breach Letter Sent', defaultResponsePeriodDays: 14 },
          ],
        },
      ],
    }
    const res = buildResponse({ outcome })
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Attended - failed to comply',
      enforcementAction: mockAppointmentOutcome().notePrepend,
      enforcementActionChangeLink: '/base/outcome/url/attended-failed-to-comply',
      evidenceDueDate: '29 May 2026',
      notes: 'Some notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: 'No next appointment',
      documents: null,
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })

  it('should create the correct summary if an outcome and letter action have been selected', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'FAILED_TO_ATTEND',
      outcomeCode: 'AFTA',
      failedToAttend: 'SEND_LETTER',
      letterSentBy: 'CASE_ADMIN',
      letterType: 'FIRST_WARNING_LETTER_SENT',
      enforcementActionCode: ['EA02'],
    }

    const appointment: Partial<Activity> = {
      documents: [
        { id: '1', name: 'FILE1' },
        { id: '2', name: 'FILE2' },
      ],
    }
    const res = buildResponse({ outcome, appointment: mockAppointment({ appointment }) })
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Failed to attend',
      enforcementAction: mockAppointmentOutcome().notePrepend,
      enforcementActionChangeLink: '/base/outcome/url/failed-to-attend',
      notes: 'Some notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: 'No next appointment',
      evidenceDueDate: '22 May 2026',
      documents: ['FILE1', 'FILE2'],
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })

  it('should create the correct summary if outcome is acceptable absence - holiday', () => {
    const outcome: AppointmentSessionOutcome = {
      outcomeType: 'ACCEPTABLE_ABSENCE',
      outcomeCode: 'AAHO',
      acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
    }
    const res = buildResponse({ outcome, nextAppointment: mockAppointment(), notes: '' })
    getOutcomeSummary(req, res, nextSpy)
    const expectedSummary: OutcomeSummary = {
      appointmentDetails: expectedAppointmentDetails,
      outcome: 'Acceptable absence - holiday',
      notes: 'No notes',
      sensitivity: mockAppointmentOutcome().appointmentSession.sensitivity,
      nextAppointment: expectedAppointmentDetails,
      documents: null,
    }
    expect(res.locals.appointmentOutcome.summary).toStrictEqual(expectedSummary)
  })
})
