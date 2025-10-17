import { v4 } from 'uuid'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import {
  checkAppointmentSummary,
  getUuid,
  crn,
  checkUpdateType,
  checkUpdateSentence,
  checkUpdateLocation,
  checkUpdateDateTime,
  checkUpdateRepeating,
  checkUpdateNotes,
  checkUpdateSensitivity,
  checkUpdateBackLinkRefresh,
} from './imports'

const loadPage = (c: string = crn) => {
  cy.visit(`/case/${c}/appointments/appointment/6/next-appointment`)
  const nextAppointmentPage = new NextAppointmentPage()
  nextAppointmentPage.getRadio('option', 1).click()
  nextAppointmentPage.getSubmitBtn().click()
}

describe('Arrange another appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should render the page', () => {
    cy.task('stubNextAppointment')
    loadPage()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    checkAppointmentSummary(arrangeAnotherAppointmentPage)
    arrangeAnotherAppointmentPage.getSubmitBtn().should('include.text', 'Arrange appointment')
  })
  describe('User clicks submit without selecting a date and time', () => {
    let dateTimePage: AppointmentDateTimePage
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    beforeEach(() => {
      cy.task('stubNextAppointment')
      loadPage()
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    })

    it('should redirect to the date/time page', () => {
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.checkOnPage()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['Enter or select a date', 'Enter a start time', 'Enter an end time'])
    })
    it('should display the error messages', () => {
      getUuid().then(uuid => {
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
          expect($error.text().trim()).to.include('Enter or select a date')
        })
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
          expect($error.text().trim()).to.include('Enter a start time')
        })
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
          expect($error.text().trim()).to.include('Enter an end time')
        })
      })
    })
  })
  describe('User clicks submit without selecting sentence or person', () => {
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      cy.task('stubAppointmentNoEventId')
      loadPage('X000001')
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    })
    it('should redirect to the sentence page', () => {
      sentencePage = new AppointmentSentencePage()
      sentencePage.checkOnPage()
    })
    it('should display the error summary box', () => {
      sentencePage.checkErrorSummaryBox(['Select what this appointment is for'])
    })
    it('should display the error messages', () => {
      getUuid().then(uuid => {
        sentencePage.getElement(`#appointments-X000001-${uuid}-eventId-error`).should($error => {
          expect($error.text().trim()).to.include('Select what this appointment is for')
        })
      })
    })
  })

  describe('User clicks submit without selecting a location', () => {
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    let locationPage: AppointmentLocationPage
    beforeEach(() => {
      cy.task('stubAppointmentNoLocation')
      loadPage('X000001')
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
      locationPage = new AppointmentLocationPage()
      locationPage.checkOnPage()
    })
    it('should display the error summary box', () => {
      locationPage.checkErrorSummaryBox(['Select an appointment location'])
    })
    it('should display the error messages', () => {
      getUuid().then(uuid => {
        locationPage.getElement(`#appointments-X000001-${uuid}-user-locationCode-error`).should($error => {
          expect($error.text().trim()).to.include('Select an appointment location')
        })
      })
    })
  })

  describe('Change appointment values', () => {
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    beforeEach(() => {
      cy.task('stubNextAppointment')
      loadPage()
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    })
    it('should update the type when value is changed', () => {
      checkUpdateType(arrangeAnotherAppointmentPage)
    })
    it('should update the sentence when value is changed', () => {
      checkUpdateSentence(arrangeAnotherAppointmentPage)
    })
    it('should update the location when value is changed', () => {
      checkUpdateLocation(arrangeAnotherAppointmentPage)
    })
    it('should update the date when value is changed', () => {
      checkUpdateDateTime(arrangeAnotherAppointmentPage)
    })
    it('should update the repeat appointment when value is changed', () => {
      checkUpdateRepeating(arrangeAnotherAppointmentPage)
    })
    it('should update the notes when value is changed', () => {
      checkUpdateSensitivity(arrangeAnotherAppointmentPage)
      checkUpdateNotes(arrangeAnotherAppointmentPage)
    })
    it('should update the sensitivity when value is changed', () => {
      checkUpdateSensitivity(arrangeAnotherAppointmentPage)
    })
    it('validation errors on change pages do not reset backLink/changeLink', () => {
      checkUpdateBackLinkRefresh(arrangeAnotherAppointmentPage)
    })
  })

  describe('Practitioner submits the appointment', () => {
    let confirmPage: AppointmentConfirmationPage
    beforeEach(() => {
      cy.task('stubNextAppointment')
      loadPage()
    })
    it('should redirect to the confirmation page', () => {
      getUuid().then(uuid => {
        const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
        checkUpdateDateTime(arrangeAnotherAppointmentPage)
        arrangeAnotherAppointmentPage.getSubmitBtn().click()
        confirmPage = new AppointmentConfirmationPage()
        confirmPage.checkOnPage()
      })
    })
  })
})
