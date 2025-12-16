import { DateTime } from 'luxon'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentdateTimePage from '../../pages/appointments/location-date-time.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import SupportingInformationPage from '../../pages/appointments/note.page'
import {
  checkAppointmentSummary,
  getUuid,
  crn,
  checkUpdateType,
  checkUpdateSentence,
  checkUpdateLocation,
  checkUpdateDateTime,
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
    cy.get('[data-qa="calendarInviteInset"]').should('not.exist')
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    checkAppointmentSummary(arrangeAnotherAppointmentPage)
    arrangeAnotherAppointmentPage.getSubmitBtn().should('include.text', 'Arrange appointment')
  })
  describe('User clicks submit without selecting a date and time', () => {
    let dateTimePage: AppointmentdateTimePage
    let supportingInformationPage: SupportingInformationPage
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    beforeEach(() => {
      cy.task('stubNextAppointment')
      loadPage()
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    })

    it('should redirect to the date/time page', () => {
      dateTimePage = new AppointmentdateTimePage()
      dateTimePage.checkOnPage()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox([
        'Enter or select a date',
        'Enter a start time',
        'Enter an end time',
        'Select an appointment location',
      ])
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
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode-error`).should($error => {
          expect($error.text().trim()).to.include('Select an appointment location')
        })
      })
    })
    it('should display the outlook invite inset text', () => {
      getUuid().then(uuid => {
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
        const tomorrow = DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy')
        dateTimePage.getDatePickerInput().clear().type(tomorrow)
        dateTimePage.getElementInput(`startTime`).type('09:10')
        dateTimePage.getElementInput(`endTime`).focus().type('10:30')
        dateTimePage.getSubmitBtn().click()
        dateTimePage.getSubmitBtn().click()
        supportingInformationPage = new SupportingInformationPage()
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        supportingInformationPage.getSubmitBtn().click()
        cy.get('[data-qa="calendarInviteInset"]').should(
          'contain.text',
          `You'll receive a calendar invite for the appointment`,
        )
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
    let locationPage: AppointmentdateTimePage
    beforeEach(() => {
      cy.task('stubAppointmentNoLocation')
      loadPage('X000001')
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
      locationPage = new AppointmentdateTimePage()
      locationPage.checkOnPage()
    })
    it('should display the error summary box', () => {
      locationPage.checkErrorSummaryBox([
        'Enter or select a date',
        'Enter a start time',
        'Enter an end time',
        'Select an appointment location',
      ])
    })
    it('should display the error messages', () => {
      getUuid().then(uuid => {
        locationPage.getElement(`#appointments-X000001-${uuid}-date-error`).should($error => {
          expect($error.text().trim()).to.include('Enter or select a date')
        })
        locationPage.getElement(`#appointments-X000001-${uuid}-start-error`).should($error => {
          expect($error.text().trim()).to.include('Enter a start time')
        })
        locationPage.getElement(`#appointments-X000001-${uuid}-end-error`).should($error => {
          expect($error.text().trim()).to.include('Enter an end time')
        })
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
      getUuid().then(_uuid => {
        const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
        checkUpdateDateTime(arrangeAnotherAppointmentPage)
        arrangeAnotherAppointmentPage.getSubmitBtn().click()
        confirmPage = new AppointmentConfirmationPage()
      })
    })
  })
})
