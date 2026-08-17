import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { Schedule } from '../../data/model/schedule'

type TestModel = {
  flags: {
    enableSupervisionPackage?: boolean
  }
  upcomingAppointments: Schedule
  pastAppointments: Schedule
  supervisionPackageDetails: any
  offenderCheckinsByCRNResponse: any
  headerPersonName: any
  hasDeceased: boolean
  crn: string
  url: string
  hasPractitioner: boolean
  canAccessCheckins: boolean
}

const baseModel: TestModel = {
  flags: {
    enableSupervisionPackage: true,
  },
  headerPersonName: {
    forename: 'James',
  },
  hasDeceased: false,
  crn: 'X000001',
  url: '',
  hasPractitioner: false,
  canAccessCheckins: false,
  offenderCheckinsByCRNResponse: {
    uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    crn: 'X778160',
    status: 'VERIFIED',
    firstCheckin: '2025-11-03',
    checkinInterval: 'WEEKLY',
    contactPreference: 'PHONE',
    photoUrl: '/assets/images/placeholder.png',
  },
  supervisionPackageDetails: {
    currentPhase: {
      supervisionPackage: { code: 'SPA', description: 'A' },
      phase: { code: 'INIT', description: 'Early Engagement' },
      eventNumber: '1',
      startDate: '2026-07-10T00:00:00+01:00',
      endDate: '2026-10-31T00:00:00Z',
    },
    earlyEngagement: {
      startDate: '2026-07-10T00:00:00+01:00',
      endDate: '2026-10-31T00:00:00Z',
      weeks: 12,
      completed: 0,
    },
    currentYear: {
      startDate: '2026-07-10',
      endDate: '2027-01-07',
      proRataFromDate: '2026-07-10',
      isFirstYear: true,
      appointments: { allowance: 46, scheduled: 1, completed: 0 },
    },
    createdAt: '2026-07-10T11:21:47+01:00',
    updatedAt: '2026-07-10T11:21:47+01:00',
    context: {
      name: { forename: 'Emely', surname: 'Harber' },
      gender: 'Male',
      sentences: [
        {
          eventNumber: '1',
          startDate: '2026-07-08',
          endDate: '2027-01-07',
          supervisionPackage: { code: 'SPA', description: 'A' },
          type: {
            code: '307',
            description: 'Adult Custody < 12m',
            isCustodial: true,
          },
          custody: {
            status: { code: 'B', description: 'Released - On Licence' },
            location: { code: 'COMMUN', description: 'In the Community' },
            finalThirdDate: '2026-11-07',
            releases: [{ releaseDate: '2026-07-10' }],
          },
          inBreach: false,
        },
      ],
      integratedOffenderManagementRedRated: false,
      offenderPersonalDisorderPathway: false,
      intensiveSupervisionCourt: false,
      nationalSecurityDivision: false,
      finalThirdEligibility: { eligible: false, since: '2026-07-10' },
    },
  },
  upcomingAppointments: {
    personSummary: {
      name: { forename: 'Emely', surname: 'Harber' },
      crn: 'Y020500',
      dateOfBirth: '1987-10-03',
    },
    personSchedule: {
      size: 10,
      page: 0,
      totalResults: 0,
      totalPages: 0,
      appointments: [],
    },
  },
  pastAppointments: {
    personSummary: {
      name: { forename: 'Emely', surname: 'Harber' },
      crn: 'Y020500',
      offenderId: 2501596083,
      dateOfBirth: '1987-10-03',
    },
    personSchedule: {
      size: 10,
      page: 0,
      totalResults: 2,
      totalPages: 1,
      appointments: [
        {
          id: '2510862722',
          eventNumber: '1',
          type: 'Planned Office Visit (NS)',
          startDateTime: '2026-08-13T12:00:00+01:00',
          endDateTime: '2026-08-13T12:01:00+01:00',
          appointmentNotes: [
            {
              id: 0,
              createdBy: 'N Mills',
              createdByDate: '2026-08-17',
              note: '17/08/2026 13:04\nEnforcement Action: Enforcement Letter Requested',
              hasNoteBeenTruncated: false,
            },
          ],
          isSensitive: false,
          hasOutcome: true,
          wasAbsent: false,
          officer: {
            code: 'N07B960',
            name: { forename: 'luca', surname: 'sanz' },
            teamCode: 'N07DTX',
            providerCode: 'N07',
            username: 'luca.sanz',
          },
          isInitial: false,
          isNationalStandard: true,
          location: {},
          rescheduled: false,
          rescheduledStaff: false,
          rescheduledPop: false,
          didTheyComply: false,
          absentWaitingEvidence: false,
          nonComplianceReason: 'Planned Office Visit (NS)',
          documents: [],
          isRarRelated: false,
          acceptableAbsence: false,
          isAppointment: true,
          isCommunication: false,
          action: 'Enforcement Letter Requested',
          isInPast: true,
          isPastAppointment: true,
          lastUpdated: '2026-08-17T13:04:47+01:00',
          lastUpdatedBy: { forename: 'Neil', surname: 'Mills' },
          outcome: 'Attended - Failed to Comply',
          deliusManaged: false,
          isVisor: false,
          eventId: 2501346257,
        },
      ],
    },
  },
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
    flags: {
      ...baseModel.flags,
      ...model.flags,
    },
  }
  const env = createNunjucksTestEnv()
  return cheerio.load(env.render('pages/appointments.njk', input))
}

xdescribe('Appointments', () => {
  it('should render the page with supervision package summary', () => {
    const $ = render()
    expect($('.govuk-grid-column-three-quarters')).toBeDefined()
    expect($('.govuk-grid-column-one-quarter')).toBeDefined()
    expect($('aside')).toBeDefined()
    expect($('.supervision-package-summary').find('h3').text()).toContain('Supervision package summary')
    expect($('[data-qa=pastAppointmentNotes1]')).toBeDefined()
    expect($('[data-qa=pastAppointmentTags1]')).toBeDefined()
  })
  it('should render the page with no supervision package summary', () => {
    const $ = render({ supervisionPackageDetails: null })
    expect($('aside')).toBeUndefined()
    expect($('.govuk-grid-column-three-quarters')).toBeUndefined()
    expect($('.govuk-grid-column-one-quarter')).toBeUndefined()
    expect($('.supervision-package-summary')).toBeUndefined()
  })
  it('should render the page with supervision packages disabled', () => {
    const $ = render({ flags: { enableSupervisionPackage: false } })
    expect($('[data-qa=pastAppointmentNotes1]')).toBeUndefined()
    expect($('[data-qa=pastAppointmentTags1]')).toBeUndefined()
    expect($('aside')).toBeUndefined()
    expect($('.govuk-grid-column-three-quarters')).toBeUndefined()
    expect($('.govuk-grid-column-one-quarter')).toBeUndefined()
    expect($('.supervision-package-summary')).toBeUndefined()
  })
})
