import * as cheerio from 'cheerio'
import { Schedule } from '../../data/model/schedule'
import { createNunjucksTestEnv } from '../../testutils/nunjucksTestEnv'
import { RiskFlag } from '../../data/model/risk'

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
  showSupaSummary: boolean
  canAccessCheckins: boolean
  riskToStaff: Partial<RiskFlag>
  riskToProbationStaff: Partial<RiskFlag>
}

const baseModel: TestModel = {
  flags: {
    enableSupervisionPackage: true,
  },
  headerPersonName: {
    forename: 'James',
  },
  hasDeceased: false,
  showSupaSummary: true,
  canAccessCheckins: false,
  riskToStaff: null,
  riskToProbationStaff: null,
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

describe('Appointments', () => {
  it('should render the page', () => {
    const $ = render()
    expect($('.govuk-grid-column-three-quarters').length).toBe(1)
    expect($('.govuk-grid-column-one-quarter').length).toBe(1)
    expect($('aside').length).toBe(1)
    expect($('[data-qa=upcomingAppointmentsSection]').find('h3').text()).toContain('Upcoming appointments')
    expect($('[data-qa=upcomingAppointmentsSection]').find('p').text()).toContain('There are no upcoming appointments.')
    expect($('[data-qa=pastAppointmentsSection]').find('h3').text()).toContain('Past appointments')
    expect($('[data-qa=pastAppointmentsSection]').find('table.appointments tbody tr').length).toBe(1)
    expect($('[data-qa=pastAppointmentType1]').text()).toContain('Planned office visit (NS)')
    expect($('[data-qa=pastAppointmentDate1]').text()).toContain('13 August 2026')
    expect($('[data-qa=pastAppointmentTime1]').text()).toContain('12pm to 12:01pm')
    expect(
      $('[data-qa=pastAppointmentsSection]').find('table.appointments tbody tr:nth-child(1) td:nth-child(4)').text(),
    ).toContain('Manage')
    expect($('.supervision-package-summary').find('h3').text()).toContain('Supervision package summary')
    expect($('[data-qa=pastAppointmentNotes1]').length).toBe(1)
    expect($('[data-qa=pastAppointmentTags1]').length).toBe(1)
  })
  it('should render the page with no supervision package summary if supa feature flag is disabled', () => {
    const $ = render({ flags: { enableSupervisionPackage: false } })
    expect($('aside').length).toBe(0)
    expect($('.govuk-grid-column-three-quarters').length).toBe(0)
    expect($('.govuk-grid-column-one-quarter').length).toBe(0)
    expect($('.supervision-package-summary').length).toBe(0)
  })
  it('should render the page with no supervision package summary if no supervision package for crn', () => {
    const $ = render({ supervisionPackageDetails: null })
    expect($('aside').length).toBe(0)
    expect($('.govuk-grid-column-three-quarters').length).toBe(0)
    expect($('.govuk-grid-column-one-quarter').length).toBe(0)
    expect($('.supervision-package-summary').length).toBe(0)
  })
  it('should render the page with no supervision package summary if primary sentence has been terminated', () => {
    const $ = render({
      supervisionPackageDetails: {
        context: { sentences: [{ supervisionPackage: { code: 'SPA' }, custody: { status: { code: 'T' } } }] },
      },
    })
    expect($('aside').length).toBe(0)
    expect($('.govuk-grid-column-three-quarters').length).toBe(0)
    expect($('.govuk-grid-column-one-quarter').length).toBe(0)
    expect($('.supervision-package-summary').length).toBe(0)
  })
  it('should render the page with risk to staff banner', () => {
    const $ = render({ riskToStaff: { id: 2500930998, level: 'HIGH' } })
    expect($('[data-qa=riskToStaffAlert]').text()).toContain('James may be a risk to probation staff')
  })
  it('should render the page with risk to probation staff banner', () => {
    const $ = render({ riskToProbationStaff: { id: 2500930998, level: 'HIGH' } })
    expect($('[data-qa=riskToStaffAlert]').text()).toContain('James is a risk to probation staff')
  })
  it('should render the page with manage check-ins button', () => {
    const $ = render({ canAccessCheckins: true })
    expect($('[data-qa="online-manage-btn"]').length).toBe(1)
    expect($('[data-qa="online-manage-btn"]').text()).toContain('Manage online check ins')
  })
  it('should render the page with set up check-ins button', () => {
    const $ = render({ canAccessCheckins: true, offenderCheckinsByCRNResponse: null })
    expect($('[data-qa="online-checkin-btn"]').length).toBe(1)
    expect($('[data-qa="online-checkin-btn"]').text()).toContain('Set up online check ins')
  })
  it('should render the page with no buttons', () => {
    const $ = render({ hasDeceased: true })
    expect($('[data-qa="arrange-appointment-btn"]').length).toBe(0)
    expect($('[data-qa="online-checkin-btn"]').length).toBe(0)
    expect($('[data-qa="online-manage-btn"]').length).toBe(0)
  })
})
