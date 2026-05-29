import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { PersonSummary } from '../../../data/model/personalDetails'

const env = createNunjucksTestEnv()

const crn = 'X000001'
const appointmentId = '1'

type TestModel = {
  crn: string
  contactId: string
  title: string
  pageTitle: string
  url: string
  flags: {
    enableNonCompliance: boolean
    enableDeepLinks: boolean
  }
  deepLinkContactTypes: string[]
  personAppointment: PersonAppointment
  sentences: Array<{ order: { description: string } }>
  nextAppointment: Record<string, unknown>
  canReschedule: boolean
  hasDeceased: boolean
}

const baseModel: TestModel = {
  crn,
  contactId: appointmentId,
  title: 'Manage planned office visit (NS) with Terry Jones',
  pageTitle: 'Manage planned office visit (NS) with Terry Jones',
  url: `/case/${crn}/appointments/appointment/${appointmentId}/manage`,
  flags: {
    enableNonCompliance: false,
    enableDeepLinks: false,
  },
  deepLinkContactTypes: ['Drug Test Appointment (NS)', 'CP/UPW - Appointment/Attendance (NS)'],
  personAppointment: {
    personSummary: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    } as PersonSummary,
    documents: [],
    appointment: {
      id: appointmentId,
      eventNumber: '7654321',
      type: 'planned office visit (NS)',
      displayName: 'planned office visit (NS)',
      startDateTime: '2023-03-20T10:00:00.000Z',
      endDateTime: '2023-03-20T11:00:00.000Z',
      deliusManaged: false,
      hasOutcome: false,
      didTheyComply: false,
      wasAbsent: false,
      acceptableAbsence: false,
      appointmentNotes: [],
      documents: [],
      isInPast: false,
      location: {},
      officer: {
        name: {
          forename: 'Terry',
          surname: 'Jones',
        },
      },
    } as Activity,
  },
  sentences: [{ order: { description: 'ORA Community Order' } }],
  nextAppointment: {
    usernameIsCom: true,
  },
  canReschedule: true,
  hasDeceased: false,
}

type TestModelOverride = Partial<Omit<TestModel, 'flags' | 'personAppointment'>> & {
  flags?: Partial<TestModel['flags']>
  personAppointment?: Partial<Omit<PersonAppointment, 'appointment'>> & {
    appointment?: Partial<Activity>
  }
}

const render = (model: TestModelOverride = {}) =>
  cheerio.load(
    env.render('pages/appointments/manage-appointment.njk', {
      ...baseModel,
      ...model,
      flags: {
        ...baseModel.flags,
        ...model.flags,
      },
      personAppointment: {
        ...baseModel.personAppointment,
        ...model.personAppointment,
        appointment: {
          ...baseModel.personAppointment.appointment,
          ...model.personAppointment?.appointment,
        },
      },
    }),
  )

describe('Alert banner', () => {
  describe('Appointment is in the future', () => {
    it('should not show the alert', () => {
      const $ = render({
        personAppointment: {
          appointment: {
            deliusManaged: false,
            appointmentNotes: [{ id: 1, note: 'Some notes' }],
            isInPast: false,
          },
        },
      })

      expect($('.moj-alert').length).toBe(0)
    })
  })

  describe('Appointment is NDelius managed', () => {
    it('should not display the alert', () => {
      const $ = render({
        personAppointment: {
          appointment: {
            deliusManaged: true,
            isInPast: true,
            hasOutcome: false,
            appointmentNotes: [],
          },
        },
      })

      expect($('.moj-alert').length).toBe(0)
    })
  })

  describe('Appointment is in the past', () => {
    describe('Outcome not logged and no notes', () => {
      it('should display the alert banner with the correct message', () => {
        const $ = render({
          personAppointment: {
            appointment: {
              deliusManaged: false,
              isInPast: true,
              hasOutcome: false,
              appointmentNotes: [],
            },
          },
        })

        expect($('.moj-alert').text()).toContain('You must log an outcome and should add notes to this appointment.')
      })
    })

    describe('Outcome logged and no notes', () => {
      it('should display the alert banner with the correct message', () => {
        const $ = render({
          personAppointment: {
            appointment: {
              deliusManaged: false,
              isInPast: true,
              hasOutcome: true,
              didTheyComply: true,
              appointmentNotes: [],
            },
          },
        })

        expect($('.moj-alert').text()).toContain('You should add notes to this appointment.')
      })
    })

    describe('No outcome logged, has notes', () => {
      it('should display the alert banner with the correct message', () => {
        const $ = render({
          personAppointment: {
            appointment: {
              deliusManaged: false,
              isInPast: true,
              hasOutcome: false,
              appointmentNotes: [{ id: 1, note: 'Some notes' }],
            },
          },
        })

        expect($('.moj-alert').text()).toContain('You must log an outcome for this appointment.')
      })
    })
  })
})
