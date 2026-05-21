import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import path from 'path'

import {
  addressToList,
  dateWithYear,
  deliusDeepLinkUrl,
  fullName,
  govukTime,
  toSentenceCase,
  yearsSince,
  handleQuotes,
} from '../../../utils'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { PersonSummary } from '../../../data/model/personalDetails'

const env = nunjucks.configure(
  [
    path.join(__dirname, '../..'),
    'node_modules/govuk-frontend/dist',
    'node_modules/govuk-frontend/dist/components',
    'node_modules/@ministryofjustice/frontend',
    'node_modules/@ministryofjustice/frontend/moj/components',
    'node_modules/@ministryofjustice/probation-search-frontend/components',
    'node_modules/@ministryofjustice/hmpps-arns-frontend-components-lib/dist',
  ],
  {
    autoescape: true,
    noCache: true,
  },
)

env.addGlobal('addressToList', addressToList)
env.addGlobal('deliusDeepLinkUrl', deliusDeepLinkUrl)
env.addFilter('dateWithYear', dateWithYear)
env.addFilter('yearsSince', yearsSince)
env.addFilter('toSentenceCase', toSentenceCase)
env.addFilter('fullName', fullName)
env.addFilter('govukTime', govukTime)
env.addFilter('handleQuotes', handleQuotes)

const crn = 'X000001'

const baseModel: {
  crn: string
  title: string
  pageTitle: string
  flags: { enableNonCompliance: boolean }
  personAppointment: PersonAppointment
  sentences: Array<{ order: { description: string } }>
  nextAppointment: Record<string, unknown>
  canReschedule: boolean
} = {
  crn,
  title: 'Manage planned office visit (NS) with Terry Jones',
  pageTitle: 'Manage planned office visit (NS) with Terry Jones',
  flags: { enableNonCompliance: false },
  personAppointment: {
    personSummary: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    } as PersonSummary,
    appointment: {
      id: '1',
      type: 'planned office visit (NS)',
      startDateTime: '',
      deliusManaged: false,
      hasOutcome: false,
      didTheyComply: false,
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
  nextAppointment: {},
  canReschedule: true,
}

const render = (model = {} as any) =>
  cheerio.load(
    env.render('pages/appointments/manage-appointment.njk', {
      ...baseModel,
      ...model,
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
            notes: true,
            isFuture: true,
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
            notes: false,
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
              hasComplied: true,
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
              appointmentNotes: [{ id: '1', note: 'Some notes' }],
            },
          },
        })

        expect($('.moj-alert').text()).toContain('You must log an outcome for this appointment.')
      })
    })
  })
})
