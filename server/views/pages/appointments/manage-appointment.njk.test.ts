import * as cheerio from 'cheerio'
import nunjucks from 'nunjucks'
import path from 'path'

import {
  addressToList,
  dateWithYear,
  yearsSince,
  toSentenceCase,
  fullName,
  deliusDeepLinkUrl,
  govukTime,
} from '../../../utils'
import { Activity } from '../../../data/model/schedule'

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

const crn = 'X000001'
const appointmentId = '123456'

const baseModel = {
  crn,
  contactId: appointmentId,
  title: 'Manage planned office visit (NS) with Terry Jones',
  pageTitle: 'Manage planned office visit (NS) with Terry Jones',
  url: `/case/${crn}/appointments/appointment/${appointmentId}/manage`,
  deepLinkContactTypes: ['Drug Test Appointment (NS)', 'CP/UPW - Appointment/Attendance (NS)'],
  flags: {
    enableNonCompliance: true,
    enableDeepLinks: false,
  },
  personAppointment: {
    personSummary: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    },
    appointment: {
      id: appointmentId,
      eventNumber: '7654321',
      type: 'Planned Office Visit (NS)',
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
      isInPast: true,
      location: {},
      officer: {
        name: {
          forename: 'Terry',
          surname: 'Jones',
        },
      },
      lastUpdatedBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
      lastUpdated: '2023-03-20',
    } as Activity,
  },
  sentences: [
    {
      order: {
        description: 'Sentence description',
      },
    },
  ],
  nextAppointment: {},
  canReschedule: true,
  hasDeceased: false,
}

const render = (model = {} as any) => {
  const appointmentOverride = model.appointment ?? model.personAppointment?.appointment ?? {}

  return cheerio.load(
    env.render('pages/appointments/manage-appointment.njk', {
      ...baseModel,
      ...model,
      flags: {
        ...baseModel.flags,
        ...model.flags,
        enableNonCompliance:
          model.enableNonCompliance ?? model.flags?.enableNonCompliance ?? baseModel.flags.enableNonCompliance,
        enableDeepLinks: model.enableDeepLinks ?? model.flags?.enableDeepLinks ?? baseModel.flags.enableDeepLinks,
      },
      personAppointment: {
        ...baseModel.personAppointment,
        ...model.personAppointment,
        appointment: {
          ...baseModel.personAppointment.appointment,
          ...appointmentOverride,
          type:
            appointmentOverride.contactType ?? appointmentOverride.type ?? baseModel.personAppointment.appointment.type,
        },
      },
    }),
  )
}

describe('Manage an appointment', () => {
  it('should render the page', () => {
    const $ = render()

    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments`)
    expect($('title').text()).toContain('Manage planned office visit (NS) with Terry Jones')
    expect($('body').text()).toContain('Last updated by Paul Smith on 20 March 2023')
  })

  describe('Alert banner', () => {
    it('should display the alert banner', () => {
      const $ = render()

      expect($('.moj-alert').length).toBe(1)
    })
  })

  describe('Appointment actions', () => {
    it('should display the section title', () => {
      const $ = render()

      expect($('[data-qa="appointmentActions"] h3').text()).toContain('Appointment actions')
    })

    it('should display the inset text and NDelius link', () => {
      const $ = render()

      const section = $('[data-qa="appointmentActions"]').first()
      const link = section.find('.govuk-inset-text a')

      expect(section.find('.govuk-inset-text').text()).toContain('You must')
      expect(link.text()).toContain('use NDelius to log non-attendance or non-compliance (opens in new tab)')
      expect(link.attr('target')).toBe('_blank')
      expect(link.attr('href')).toBe(
        `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=${crn}&contactID=${appointmentId}`,
      )
    })

    describe('enableNonCompliance feature flag is enabled', () => {
      it('should display log outcome action', () => {
        const $ = render({ enableNonCompliance: true })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Log appointment outcome')
      })

      it('should display appointment notes action', () => {
        const $ = render({ enableNonCompliance: true })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Add appointment notes')
      })

      it('should display upload documents action', () => {
        const $ = render({ enableNonCompliance: true })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Upload documents')
      })

      it('should display arrange next appointment action', () => {
        const $ = render({ enableNonCompliance: true })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Arrange next appointment')
      })
    })

    describe('enableNonCompliance feature flag is disabled', () => {
      it('should display log outcome action', () => {
        const $ = render({ enableNonCompliance: false })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Log attended and complied appointment')
      })

      it('should display appointment notes action', () => {
        const $ = render({ enableNonCompliance: false })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Add appointment notes')
      })

      it('should not display upload documents action', () => {
        const $ = render({ enableNonCompliance: false })

        expect($('[data-qa="appointmentActions"]').text()).not.toContain('Upload documents')
      })

      it('should display arrange next appointment action', () => {
        const $ = render({ enableNonCompliance: false })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Arrange next appointment')
      })
    })

    describe('Appointment type is NDelius managed', () => {
      it('should not display the appointment actions', () => {
        const $ = render({
          appointment: {
            deliusManaged: true,
          },
        })

        expect($('[data-qa="appointmentActions"]').length).toBe(0)
      })
    })
  })

  describe('Appointment details', () => {
    it('should display the section title', () => {
      const $ = render()

      expect($('[data-qa="appointmentDetails"] h3').text()).toContain('Appointment details')
    })

    describe('enableNonCompliance feature flag is enabled', () => {
      describe('MPOP managed appointment', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: true,
            appointment: {
              deliusManaged: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, no outcome', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: true,
            appointment: {
              deliusManaged: true,
              hasOutcome: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, complied', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: true,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: true,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, acceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: true,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: false,
              wasAbsent: true,
              acceptableAbsence: true,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, unacceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: true,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: false,
              wasAbsent: true,
              acceptableAbsence: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })
    })

    describe('enableNonCompliance feature flag is disabled', () => {
      describe('MPOP managed appointment', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: false,
            appointment: {
              deliusManaged: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, no outcome', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: false,
            appointment: {
              deliusManaged: true,
              hasOutcome: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, complied', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: false,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: true,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, acceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: false,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: false,
              wasAbsent: true,
              acceptableAbsence: true,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, unacceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            enableNonCompliance: false,
            appointment: {
              deliusManaged: true,
              hasOutcome: true,
              didTheyComply: false,
              wasAbsent: true,
              acceptableAbsence: false,
            },
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })
    })

    describe('enableDeepLinks feature flag is enabled', () => {
      describe('drug test appointment type', () => {
        it('should display the drug history deep link with correct wording', () => {
          const $ = render({
            enableDeepLinks: true,
            appointment: {
              deliusManaged: true,
              contactType: 'Drug Test Appointment (NS)',
            },
          })

          const section = $('[data-qa="appointmentDetails"]')
          const link = section.find('.govuk-body a')

          expect(section.find('.govuk-body').text()).toContain('You can manage this appointment through the')
          expect(link.text()).toContain('drug history in NDelius (opens in a new tab)')
          expect(link.attr('target')).toBe('_blank')
          expect(link.attr('href')).toBe(
            `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=DrugHistory&CRN=${crn}&EventNumber=7654321`,
          )
        })
      })

      describe('CP/UPW appointment type', () => {
        it('should display the UPW worksheet deep link with correct wording', () => {
          const $ = render({
            enableDeepLinks: true,
            appointment: {
              deliusManaged: true,
              contactType: 'CP/UPW - Appointment/Attendance (NS)',
            },
          })

          const section = $('[data-qa="appointmentDetails"]')
          const link = section.find('.govuk-body a')

          expect(section.find('.govuk-body').text()).toContain('You can manage this appointment through the')
          expect(link.text()).toContain('unpaid work worksheet summary in NDelius (opens in a new tab)')
          expect(link.attr('target')).toBe('_blank')
          expect(link.attr('href')).toBe(
            `https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UPWWorksheet&CRN=${crn}&EventNumber=7654321`,
          )
        })
      })
    })
  })
})
