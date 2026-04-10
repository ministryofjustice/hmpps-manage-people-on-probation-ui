import { DateTime } from 'luxon'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { crn, appointmentId, uuid } from '../appointments/imports/common'
import { completeSentencePage, completeTypePage, completeLocationDateTimePage } from '../appointments/utils'
import AttendedCompliedPage from '../../pages/appointmentOutcomes/attended-complied.page'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import UnacceptableAbsencePage from '../../pages/appointmentOutcomes/unacceptable-absence.page'
import FailedToAttendPage from '../../pages/appointmentOutcomes/failed-to-attend.page'
import { AppointmentOutcomeType } from '../../../server/models/Appointments'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import AddNotePage from '../../pages/appointmentOutcomes/add-note.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage

const loadPage = ({
  arrangeAppointmentJourney = true,
  dateInPast = false,
  inOffice = true,
  id = appointmentId,
} = {}) => {
  if (arrangeAppointmentJourney) {
    completeSentencePage()
    completeTypePage(inOffice ? 1 : 2)
    completeLocationDateTimePage({ dateInPast })
  } else {
    cy.visit(`/case/${crn}/appointments/appointment/${id}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
}

const checkPage = ({ first = false, arrangeAppointmentJourney = true, dateInPast = false, inOffice = true } = {}) => {
  const now = DateTime.now()
  const pastDate = now.minus({ days: 1 }).toFormat('cccc d MMMM yyyy')
  const futureDate = now.plus({ days: 1 }).toFormat('cccc d MMMM yyyy')
  let optionValues: AppointmentOutcomeType[]
  let appointmentDate = arrangeAppointmentJourney ? pastDate : 'Wednesday 21 February 2024'
  let meetingType = !arrangeAppointmentJourney ? '3 Way Meeting (NS)' : 'Planned Office Visit (NS)'
  if (!inOffice) {
    meetingType = 'Planned Telephone Contact (NS)'
  }
  const officer = arrangeAppointmentJourney ? 'Deborah Fern' : 'Terry Jones'
  const pageTitle = dateInPast
    ? 'What was the outcome of this appointment?'
    : 'Why will Alton not attend this appointment?'
  if (!dateInPast) {
    appointmentDate = futureDate
    optionValues = ['ACCEPTABLE_ABSENCE', 'WILL_BE_RESCHEDULED']
  }
  if (dateInPast && inOffice) {
    optionValues = [
      'ATTENDED',
      'ATTENDED_SENT_HOME_BEHAVIOUR',
      'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES',
      'ACCEPTABLE_ABSENCE',
      'UNACCEPTABLE_ABSENCE',
      'EVIDENCE_REQUESTED',
    ]
  }
  if (dateInPast && !inOffice) {
    optionValues = [
      'ATTENDED',
      'ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS',
      'ACCEPTABLE_ABSENCE',
      'UNACCEPTABLE_ABSENCE',
      'EVIDENCE_REQUESTED',
    ]
  }
  it('should render the page', () => {
    outcomePage = new OutcomePage()
    const id = arrangeAppointmentJourney ? uuid : appointmentId
    outcomePage.checkPageTitle(pageTitle)
    cy.get(`#appointments-${crn}-${id}-outcome-type-hint`).should(
      'contain.text',
      `Appointment: ${meetingType} with ${officer} on ${appointmentDate}.`,
    )
    cy.get('.govuk-radios__item').each(($el, index) => {
      cy.wrap($el).find('input').should('have.value', optionValues[index])
    })
  })
  if (first) {
    it('should have a working back link', () => {
      outcomePage
        .getBackLink()
        .should(
          'have.attr',
          'href',
          arrangeAppointmentJourney
            ? `/case/${crn}/arrange-appointment/${uuid}/location-date-time`
            : `/case/${crn}/appointments/appointment/${appointmentId}/manage`,
        )
    })
    it('should have a working cancel link', () => {
      outcomePage
        .getCancelGoBackLink()
        .should(
          'have.attr',
          'href',
          arrangeAppointmentJourney
            ? `/case/${crn}/arrange-appointment/${uuid}/location-date-time`
            : `/case/${crn}/appointments/appointment/${appointmentId}/manage`,
        )
    })
  }
}

describe('Appointment outcome', () => {
  let attendedCompliedPage: AttendedCompliedPage
  let attendedFailedToComplyPage: AttendedFailedToComplyPage
  beforeEach(() => {
    cy.task('stubEnableNonCompliance')
  })
  afterEach(() => {
    cy.task('resetMocks')
    cy.clearCookies()
  })
  describe('Arrange appointment journey', () => {
    describe('Appointment in past', () => {
      describe('In office appointment', () => {
        beforeEach(() => {
          loadPage({ dateInPast: true })
        })
        checkPage({ first: true, dateInPast: true })
      })
      describe('Not in office appointment', () => {
        beforeEach(() => {
          loadPage({ dateInPast: true, inOffice: false })
        })
        checkPage({ dateInPast: true, inOffice: false })
      })
    })
  })
  describe('Manage appointment journey', () => {
    describe('Appointment in past', () => {
      describe('In office appointment', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, eventId: 2501192724 })
          loadPage({ arrangeAppointmentJourney: false, dateInPast: true })
        })
        checkPage({ first: true, arrangeAppointmentJourney: false, dateInPast: true })
      })
      describe('Not in office appointment', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: false, eventId: 2501192724, inOffice: false })
          loadPage({ arrangeAppointmentJourney: false, dateInPast: true, inOffice: false })
        })
        checkPage({ arrangeAppointmentJourney: false, dateInPast: true, inOffice: false })
      })
    })
    describe('Appointment in future', () => {
      beforeEach(() => {
        cy.task('stubAppointment', { isFuture: true, eventId: 2501192724, inOffice: true })
        loadPage({ arrangeAppointmentJourney: false, dateInPast: false, inOffice: true })
      })
      checkPage({ arrangeAppointmentJourney: false })
    })
  })
  describe('Form submitted with no option is selected', () => {
    describe('Arrange appointment journey', () => {
      describe('Appointment in past', () => {
        const msg = 'Select an outcome for this appointment'
        beforeEach(() => {
          loadPage({ dateInPast: true })
          outcomePage.getSubmitBtn().click()
        })
        it('should show error summary with correct message', () => {
          outcomePage.checkErrorSummaryBox([msg])
          cy.get(`#appointments-${crn}-${uuid}-outcome-type-error`).should('contain.text', msg)
        })
      })
    })
    describe('Manage appointment journey', () => {
      describe('Appointment in past', () => {
        const msg = 'Select an outcome for this appointment'
        beforeEach(() => {
          loadPage({ arrangeAppointmentJourney: false, dateInPast: true })
          outcomePage.getSubmitBtn().click()
        })
        it('should show error summary with correct message', () => {
          outcomePage.checkErrorSummaryBox([msg])
          cy.get(`#appointments-${crn}-${appointmentId}-outcome-type-error`).should('contain.text', msg)
        })
      })
      describe('Appointment in future', () => {
        const msg = 'Select why they will not attend this appointment'
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, eventId: 2501192724 })
          loadPage({ arrangeAppointmentJourney: false, dateInPast: false })
          outcomePage.getSubmitBtn().click()
        })
        it('should show error summary with correct message', () => {
          outcomePage.checkErrorSummaryBox([msg])
          cy.get(`#appointments-${crn}-${appointmentId}-outcome-type-error`).should('contain.text', msg)
        })
      })
    })
  })

  interface Option {
    value: AppointmentOutcomeType
    pageName: string
    pageTitle: string
    Page:
      | typeof AttendedCompliedPage
      | typeof AttendedFailedToComplyPage
      | typeof AcceptableAbsencePage
      | typeof UnacceptableAbsencePage
      | typeof FailedToAttendPage
  }

  type OutcomeOptions = {
    [K in AppointmentOutcomeType]: Option
  }

  const outcomeOptions: OutcomeOptions = {
    ATTENDED: { value: 'ATTENDED', pageName: 'Add a note', pageTitle: 'Add a note', Page: AddNotePage },
    ATTENDED_SENT_HOME_BEHAVIOUR: {
      value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
      pageName: 'Attended failed to comply',
      pageTitle: 'Enforcement action for Alton’s failure to comply',
      Page: AttendedFailedToComplyPage,
    },
    ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES: {
      value: 'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES',
      pageName: 'Attended failed to comply',
      pageTitle: 'Enforcement action for Alton’s failure to comply',
      Page: AttendedFailedToComplyPage,
    },
    ACCEPTABLE_ABSENCE: {
      value: 'ACCEPTABLE_ABSENCE',
      pageName: 'Acceptable absence',
      pageTitle: 'Why was Alton’s absence acceptable?',
      Page: AcceptableAbsencePage,
    },
    UNACCEPTABLE_ABSENCE: {
      value: 'UNACCEPTABLE_ABSENCE',
      pageName: 'Unacceptable absence',
      pageTitle: 'Enforcement action for Alton’s unacceptable absence',
      Page: UnacceptableAbsencePage,
    },
    EVIDENCE_REQUESTED: {
      value: 'EVIDENCE_REQUESTED',
      pageName: 'Failed to attend',
      pageTitle: 'Enforcement action for Alton’s absence',
      Page: FailedToAttendPage,
    },
    ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS: {
      value: 'ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS',
      pageName: 'Attended failed to comply',
      pageTitle: 'Enforcement action for Alton’s failure to comply',
      Page: AttendedFailedToComplyPage,
    },
    WILL_BE_RESCHEDULED: {
      value: 'WILL_BE_RESCHEDULED',
      pageName: 'Reschedule an appointment',
      pageTitle: 'Reschedule an appointment',
      Page: RescheduleAppointmentPage,
    },
  }

  const checkOptionsRedirect = ({
    expectedOptions,
    arrangeAppointmentJourney = true,
  }: {
    expectedOptions: AppointmentOutcomeType[]
    arrangeAppointmentJourney?: boolean
  }) => {
    const options: Option[] = [...expectedOptions.map(value => outcomeOptions[value])]
    options.forEach(({ value, pageName, pageTitle, Page }) => {
      it(`should redirect to the ${pageName} page when ${value} is selected`, () => {
        cy.get(`.govuk-radios__input[value='${value}']`).click()
        outcomePage.getSubmitBtn().click()
        const page = new Page()
        page.checkPageTitle(pageTitle)
        cy.url().should('include', arrangeAppointmentJourney ? '/arrange-appointment/' : '/appointments/')
      })
    })
  }

  describe(`Outcome option selected`, () => {
    describe('Arrange appointment journey', () => {
      describe('Appointment in past', () => {
        describe('In office appointment', () => {
          beforeEach(() => {
            loadPage({ dateInPast: true })
          })
          const expectedOptions: AppointmentOutcomeType[] = [
            'ATTENDED',
            'ATTENDED_SENT_HOME_BEHAVIOUR',
            'ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES',
            'ACCEPTABLE_ABSENCE',
            'UNACCEPTABLE_ABSENCE',
            'EVIDENCE_REQUESTED',
          ]
          checkOptionsRedirect({ expectedOptions })
        })
        describe('Not in office appointment', () => {
          beforeEach(() => {
            loadPage({ dateInPast: true, inOffice: false })
          })
          const expectedOptions: AppointmentOutcomeType[] = ['ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS']
          checkOptionsRedirect({ expectedOptions })
        })
      })

      describe('Manage appointment journey', () => {
        describe('Appointment in future', () => {
          beforeEach(() => {
            cy.task('stubAppointment', { isFuture: true, eventId: 2501192724, inOffice: true, contactId: '666' })
            loadPage({ arrangeAppointmentJourney: false, id: '666' })
          })
          const expectedOptions: AppointmentOutcomeType[] = ['ACCEPTABLE_ABSENCE', 'WILL_BE_RESCHEDULED']
          checkOptionsRedirect({ expectedOptions, arrangeAppointmentJourney: false })
        })
      })
    })
  })
})
