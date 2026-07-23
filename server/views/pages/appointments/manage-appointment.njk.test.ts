import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity, LinkedContactResponse, PersonAppointment } from '../../../data/model/schedule'
import { PersonSummary } from '../../../data/model/personalDetails'
import { AppointmentOutcomeProps } from '../../../models/Locals'
import { NextAppointmentResponse } from '../../../models/Appointments'
import { Sentence } from '../../../data/model/sentenceDetails'

const crn = 'X000001'
const appointmentId = '123456'

const sentence: Sentence = {
  id: 2501085207,
  eventNumber: '7654321',
  order: {
    description: 'Adult Custody < 12m (3 Months)',
    sentenceType: 'CUSTODY',
    startDate: '2024-06-04',
    endDate: '2025-09-02',
    pss: true,
  },
  nsis: [],
  licenceConditions: [],
  requirements: [],
}

type TestModel = {
  crn: string
  contactId: string
  title: string
  pageTitle: string
  url: string
  flags: {
    enableNonCompliance?: boolean
    enableRescheduleFutureAppointmentWithOutcome?: boolean
  }
  deepLinkContactTypes: string[]
  personAppointment: PersonAppointment
  appointmentOutcome: AppointmentOutcomeProps<Activity>
  sentence: Partial<Sentence>
  sentences: Partial<Sentence>[]
  nextAppointment: Partial<NextAppointmentResponse>
  canReschedule: boolean
  hasDeceased: boolean
  back?: string
  relatedContacts: LinkedContactResponse
}

const nextAppointment: Partial<NextAppointmentResponse> = {
  appointment: {
    id: '2510756010',
    eventNumber: '4',
    type: 'Planned Office Visit (NS)',
    startDateTime: '2026-07-02T11:11:00+01:00',
    endDateTime: '2026-07-02T11:12:00+01:00',
    appointmentNotes: [],
    isSensitive: false,
    hasOutcome: false,
    wasAbsent: false,
    officer: {
      code: 'N56A119',
      name: { forename: 'Leigh', surname: 'Christie' },
      teamCode: 'N56N07',
      providerCode: 'N56',
      username: 'leigh.christie1',
    },
    isInitial: false,
    isNationalStandard: true,
    location: {
      code: 'N56WEMC',
      officeName: 'Wellingborough Magistrates Court',
      buildingName: 'The Court House',
      streetName: 'Midland Road',
      town: 'Wellingborough',
      county: 'Northamptonshire',
      postcode: 'NN8 1HF',
      ldu: 'Default Unallocated District',
      telephoneNumber: '01933 271415',
    },
    rescheduled: false,
    rescheduledStaff: false,
    rescheduledPop: false,
    absentWaitingEvidence: false,
    documents: [],
    isRarRelated: false,
    acceptableAbsence: false,
    isAppointment: true,
    isCommunication: false,
    isSystemContact: false,
    isEmailOrTextFromPop: false,
    isPhoneCallFromPop: false,
    isEmailOrTextToPop: false,
    isPhoneCallToPop: false,
    isInPast: false,
    isPastAppointment: false,
    lastUpdated: '2026-07-01T14:59:04+01:00',
    lastUpdatedBy: { forename: 'ravindrakumar', surname: 'killamsetty' },
    deliusManaged: false,
    isVisor: false,
    eventId: 2501085207,
    externalReference: 'urn:uk:gov:hmpps:manage-supervision-service:appointment:968bfbbd-33a5-46f1-887d-0147465cfe3c',
  },
  personManager: { name: { forename: 'leigh', surname: 'christie1' }, code: 'ABC' },
  usernameIsCom: false,
}

const baseModel: TestModel = {
  crn,
  contactId: appointmentId,
  title: 'Manage planned office visit (NS) with Terry Jones',
  pageTitle: 'Manage planned office visit (NS) with Terry Jones',
  url: `/case/${crn}/appointments/appointment/${appointmentId}/manage`,
  flags: {
    enableNonCompliance: false,
  },
  deepLinkContactTypes: ['Drug Test Appointment (NS)', 'CP/UPW - Appointment/Attendance (NS)'],
  personAppointment: {
    documents: [],
    personSummary: {
      name: {
        forename: 'Terry',
        surname: 'Jones',
      },
    } as PersonSummary,
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
    enforcementAction: { code: 'IBR', description: '', responseByDate: '' },
  },
  appointmentOutcome: {} as AppointmentOutcomeProps<Activity>,
  sentence,
  sentences: [sentence],
  nextAppointment: {
    usernameIsCom: true,
  },
  canReschedule: true,
  hasDeceased: false,
  relatedContacts: [],
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
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
      enforcementAction: {
        ...baseModel.personAppointment.enforcementAction,
        ...model.personAppointment?.enforcementAction,
      },
    },
    appointmentOutcome: {
      ...baseModel.appointmentOutcome,
      ...model.appointmentOutcome,
    },
    sentences: [...baseModel.sentences, ...(model?.sentences || [])],
  }
  const env = createNunjucksTestEnv()
  return cheerio.load(env.render('pages/appointments/manage-appointment.njk', input))
}

describe('Manage an appointment', () => {
  it('should render the page', () => {
    const $ = render()

    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments`)
    expect($('title').text()).toContain('Manage planned office visit (NS) with Terry Jones')
    expect($('body').text()).toContain('Last updated by Paul Smith on 20 March 2023')
  })

  it('should use description for title if no displayName', () => {
    const $ = render({
      personAppointment: {
        appointment: {
          type: 'Planned Office Visit (NS)',
          description: 'Drug test',
          displayName: undefined,
        },
      },
    } as Partial<TestModel>)

    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments`)
    expect($('title').text()).toContain('Manage drug test with Terry Jones')
    expect($('body').text()).toContain('Last updated by Paul Smith on 20 March 2023')
  })

  it('should use type for title if no displayName or description (remember sentence case)', () => {
    const $ = render({
      personAppointment: {
        appointment: {
          type: 'Planned Video Call (NS)',
          description: undefined,
          displayName: undefined,
        },
      },
    } as Partial<TestModel>)

    expect($('.govuk-back-link').attr('href')).toBe(`/case/${crn}/appointments`)
    expect($('title').text()).toContain('Manage planned video call (NS) with Terry Jones')
    expect($('body').text()).toContain('Last updated by Paul Smith on 20 March 2023')
  })

  describe('Alert banner', () => {
    it('should display the alert banner', () => {
      const $ = render()
      expect($('.moj-alert').length).toBe(1)
    })
  })

  describe('Evidence warning banner', () => {
    it('should display the evidence warning', () => {
      const $ = render({
        flags: {
          enableNonCompliance: true,
        },
        personAppointment: {
          appointment: {
            deliusManaged: false,
            hasOutcome: true,
            didTheyComply: false,
            outcome: 'Attended - failed to comply',
          } as Partial<Activity>,
          enforcementAction: { code: 'IBR', description: '', responseByDate: '2026-06-01' },
        } as PersonAppointment,
        appointmentOutcome: {
          currentEnforcementAction: {
            evidenceWarning: 'Stuart has until 9 February to submit evidence (5 days remaining)',
          },
        } as AppointmentOutcomeProps<Activity>,
      })
      expect($('[data-qa="evidenceWarning"]').length).toBe(1)
    })

    it('should not display the evidence warning', () => {
      const $ = render({
        flags: {
          enableNonCompliance: true,
        },
        personAppointment: {
          appointment: {
            deliusManaged: false,
            didTheyComply: false,
            outcome: 'Attended - failed to comply',
          } as Partial<Activity>,
          enforcementAction: { code: 'NFA', description: '', responseByDate: '2026-06-01' },
        } as PersonAppointment,
        appointmentOutcome: {
          currentEnforcementAction: {
            evidenceWarning: null,
          },
        } as AppointmentOutcomeProps<Activity>,
      })
      expect($('[data-qa="evidenceWarning"]').length).toBe(0)
    })
  })

  describe('Appointment actions', () => {
    it('should display the section title', () => {
      const $ = render()

      expect($('[data-qa="appointmentActions"] h3').text()).toContain('Appointment actions')
    })

    describe('enableNonCompliance feature flag is enabled', () => {
      it('should display log outcome action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
        })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Log appointment outcome')
      })

      it('should display change enforcement action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
          personAppointment: {
            appointment: {
              deliusManaged: false,
              outcome: 'Attended - Failed to comply',
              hasOutcome: true,
              action: 'No Further Action',
              didTheyComply: false,
            } as Activity,
          } as PersonAppointment,
        })
        expect($('[data-qa="appointmentActions"]').text()).toContain('Change enforcement action')
      })

      it('should not display change enforcement action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
          personAppointment: {
            appointment: {
              deliusManaged: false,
              outcome: 'Attended - Complied',
              hasOutcome: true,
              action: '',
              didTheyComply: true,
            } as Activity,
          } as PersonAppointment,
        })
        expect($('[data-qa="appointmentActions"]').text()).not.toContain('Change enforcement action')
      })

      it('should not display the change outcome link if future appointment with outcome logged and enableRescheduleFutureAppointmentWithOutcome flag is disabled', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
            enableRescheduleFutureAppointmentWithOutcome: false,
          },
          personAppointment: {
            appointment: {
              deliusManaged: false,
              outcome: 'Acceptable absence - Holiday',
              hasOutcome: true,
              action: '',
              didTheyComply: true,
              isInPast: false,
            } as Activity,
          } as PersonAppointment,
        })
        expect($('[data-qa="appointmentActions"]').text()).toContain(
          'You cannot change this outcome until the appointment has passed.',
        )
      })

      it('should display appointment notes action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
        })

        expect($('[data-qa="appointmentActions"]').text()).toContain('Add appointment notes')
      })

      it('should display upload documents action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
        })
        expect($('[data-qa="appointmentActions"]').text()).toContain('Upload documents')
      })

      it('should display arrange next appointment action', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
        })
        expect($('[data-qa="appointmentActions"]').text()).toContain('Arrange next appointment')
      })

      it('should display the next appointment details', () => {
        const $ = render({
          flags: {
            enableNonCompliance: true,
          },
          nextAppointment,
        })
        expect($('[data-qa="appointmentActions"]').text()).toContain(
          'Planned office visit (NS) arranged with Leigh on Thursday 2 July 2026 at 11:11am',
        )
      })
    })

    describe('enableNonCompliance feature flag is disabled', () => {
      it('should display log outcome action', () => {
        const $ = render({})

        expect($('[data-qa="appointmentActions"]').text()).toContain('Log attended and complied appointment')
      })

      it('should display appointment notes action', () => {
        const $ = render({})

        expect($('[data-qa="appointmentActions"]').text()).toContain('Add appointment notes')
      })

      it('should not display upload documents action', () => {
        const $ = render({})

        expect($('[data-qa="appointmentActions"]').text()).not.toContain('Upload documents')
      })

      it('should display arrange next appointment action', () => {
        const $ = render({})

        expect($('[data-qa="appointmentActions"]').text()).toContain('Arrange next appointment')
      })
    })

    describe('Appointment type is NDelius managed', () => {
      it('should not display the appointment actions', () => {
        const $ = render({
          personAppointment: {
            appointment: {
              deliusManaged: true,
            } as Activity,
          } as PersonAppointment,
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
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: false,
                eventNumber: '7654321',
              } as Activity,
            } as PersonAppointment,
          })
          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
          expect($('[data-qa="sentenceValue"]').text()).toContain('Adult Custody < 12m (3 Months)')
          expect($('[data-qa="sentenceLink"]').text()).toContain('View sentence details')
          expect($('[data-qa="sentenceLink"]').attr('href')).toBe('/case/X000001/sentence?number=7654321')
        })
      })

      describe('Delius managed appointment type, no outcome', () => {
        it('should display appointment details', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: false,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, complied', () => {
        it('should display appointment details', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: true,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, acceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: false,
                wasAbsent: true,
                acceptableAbsence: true,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, unacceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: false,
                wasAbsent: true,
                acceptableAbsence: false,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })
    })

    describe('enableNonCompliance feature flag is disabled', () => {
      describe('MPOP managed appointment', () => {
        it('should display appointment details', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: false,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, no outcome', () => {
        it('should display appointment details', () => {
          const $ = render({
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: false,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment type, complied', () => {
        it('should display appointment details', () => {
          const $ = render({
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: true,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, acceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: false,
                wasAbsent: true,
                acceptableAbsence: true,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })

      describe('Delius managed appointment, unacceptable absence', () => {
        it('should display appointment details', () => {
          const $ = render({
            personAppointment: {
              appointment: {
                deliusManaged: true,
                hasOutcome: true,
                didTheyComply: false,
                wasAbsent: true,
                acceptableAbsence: false,
              } as Activity,
            } as PersonAppointment,
          })

          expect($('[data-qa="appointmentDetails"]').text()).toContain('Appointment details')
        })
      })
    })

    describe('deep link contact types', () => {
      describe('drug test appointment type', () => {
        it('should display the drug history deep link with correct wording', () => {
          const $ = render({
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                type: 'Drug Test Appointment (NS)',
              } as Activity,
            } as PersonAppointment,
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
            flags: {
              enableNonCompliance: true,
            },
            personAppointment: {
              appointment: {
                deliusManaged: true,
                type: 'CP/UPW - Appointment/Attendance (NS)',
              } as Activity,
            } as PersonAppointment,
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

    describe('Related contacts', () => {
      it('should not display the list items if no related contacts are available', () => {
        const $ = render({})
        const relatedContacts = $('[data-qa="relatedContacts"]')
        expect(relatedContacts.find('h3').text()).toContain('Related contacts')
        expect(relatedContacts.find('p').text()).toContain('No related contacts')
      })
      it('should display the list if related contacts are available', () => {
        const $ = render({
          relatedContacts: [
            {
              contactId: 2510615347,
              contactTypeDescription: 'Breach Action - Breach Letter Sent',
              contactDate: '2026-05-12',
              createdBy: { forename: 'James', surname: 'Frost' },
            },
            {
              contactId: 2510615348,
              contactTypeDescription: 'First warning letter sent',
              contactDate: '2026-05-19',
              createdBy: { forename: 'Teddy', surname: 'Morris' },
            },
            {
              contactId: 2510615349,
              contactTypeDescription: 'First warning letter requested',
              contactDate: '2026-05-16',
              createdBy: { forename: 'Jack', surname: 'Smith' },
            },
          ],
        })
        const relatedContacts = $('[data-qa="relatedContacts"]')
        const getRelatedContact = (index: number) => {
          return $(`[data-qa="relatedContacts"]`).find('li').eq(index)
        }
        const getRelatedContactLink = (index: number) => {
          return getRelatedContact(index).find('.govuk-link')
        }
        expect(relatedContacts.find('h3').text()).toContain('Related contacts')
        expect(relatedContacts.find('li').length).toBe(3)
        expect(getRelatedContactLink(0).text()).toContain('Breach action - breach letter sent')
        expect(getRelatedContactLink(0).attr('target')).toBe('_blank')
        expect(getRelatedContactLink(0).attr('href')).toBe(
          '/case/X000001/activity/2510615347?back=%2Fcase%2FX000001%2Fappointments%2Fappointment%2F123456%2Fmanage%3Fback%3D%2Fcase%2FX000001%2Fappointments',
        )
        expect(getRelatedContact(0).text()).toContain('Created by J.Frost')
        expect(getRelatedContact(0).text()).toContain('on 12 May 2026')
      })
    })
  })
})
