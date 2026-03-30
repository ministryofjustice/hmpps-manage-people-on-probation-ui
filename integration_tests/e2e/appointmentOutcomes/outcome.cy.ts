import { DateTime } from 'luxon'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { crn, appointmentId, uuid } from '../appointments/imports/common'
import { completeSentencePage, completeTypePage, completeLocationDateTimePage } from '../appointments/utils'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage

const loadPage = ({ arrangeAppointmentJourney = true, dateInPast = false, inOffice = true } = {}) => {
  if (arrangeAppointmentJourney) {
    completeSentencePage()
    completeTypePage(inOffice ? 1 : 2)
    completeLocationDateTimePage({ dateInPast })
  } else {
    cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
}

const checkPage = ({ first = false, arrangeAppointmentJourney = true, dateInPast = false, inOffice = true } = {}) => {
  const now = DateTime.now()
  const futureDate = now.plus({ days: 1 }).toFormat('cccc d MMMM yyyy')
  let optionValues: string[]
  let appointmentDate = arrangeAppointmentJourney ? 'Sunday 29 March 2026' : 'Wednesday 21 February 2024'
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
  beforeEach(() => {
    cy.task('resetMocks')
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
    describe('Appointment in future', () => {
      describe('In office appointment', () => {
        beforeEach(() => {
          loadPage()
        })
        checkPage()
      })
      describe('Not in office appointment', () => {
        beforeEach(() => {
          loadPage({ inOffice: false })
        })
        checkPage({ inOffice: false })
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
      describe('In office appointment', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, eventId: 2501192724, inOffice: true })
          loadPage({ arrangeAppointmentJourney: false, dateInPast: false, inOffice: true })
        })
        checkPage({ arrangeAppointmentJourney: false })
      })
      describe('Not in office appointment', () => {
        beforeEach(() => {
          cy.task('stubAppointment', { isFuture: true, eventId: 2501192724, inOffice: false })
          loadPage({ arrangeAppointmentJourney: false, dateInPast: false, inOffice: false })
        })
        checkPage({ arrangeAppointmentJourney: false, inOffice: false })
      })
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
      describe('Appointment in future', () => {
        const msg = 'Select why they will not attend this appointment'
        beforeEach(() => {
          loadPage({ dateInPast: false })
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
})
