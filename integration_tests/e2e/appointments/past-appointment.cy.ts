import { DateTime } from 'luxon'
import {
  completeSentencePage,
  completeTypePage,
  completeAttendedCompliedPage,
  crn,
  uuid,
  completeAddNotePage,
} from './imports'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'

const loadDateTimePage = () => {
  completeSentencePage()
  completeTypePage()
}

describe('Appointment in the past', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  let locationDateTimePage: AppointmentLocationDateTimePage
  let logOutcomePage: AttendedCompliedPage
  describe('Date is selected from the picker which is in the past', () => {
    const now = DateTime.now()
    const yesterday = now.minus({ days: 1 })
    const yesterdayIsInCurrentMonth = yesterday.month === now.month
    beforeEach(() => {
      loadDateTimePage()
      locationDateTimePage.getDatePickerToggle().click()
      if (!yesterdayIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
      cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).click()
    })
    it('should display the log an outcome alert banner', () => {
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
    it('should hide the alert banner if date is selected from the picker in the future', () => {
      const tomorrow = now.plus({ days: 1 })
      const tomorrowIsInCurrentMonth = tomorrow.month === now.month

      locationDateTimePage.getDatePickerToggle().click()
      if (!yesterdayIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
      if (!tomorrowIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
      cy.get(`[data-testid="${tomorrow.toFormat('d/M/yyyy')}"]`).click()
      it('should hide the alert banner', () => {
        cy.get('[data-module="serviceAlert"]').should('not.be.visible')
      })
    })
  })

  describe('Date is entered which is in the past', () => {
    const now = DateTime.now()
    const yesterday = now.minus({ days: 1 })
    beforeEach(() => {
      loadDateTimePage()
      locationDateTimePage.getDatePickerInput().type(`${yesterday.toFormat('d/M/yyyy')}`)
    })
    it('should display the log an outcome alert banner', () => {
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
    it('should hide the alert banner if a date is entered in the future', () => {
      const tomorrow = now.plus({ days: 1 }).toFormat('d/M/yyyy')
      locationDateTimePage.getDatePickerInput().clear().type(tomorrow)
      cy.get('[data-module="serviceAlert"]').should('not.be.visible')
    })
  })

  describe('Todays date is selected from the picker, and a start time in the past is entered', () => {
    const mockedTime = DateTime.local().set({
      hour: 9,
      minute: 1,
      second: 0,
      millisecond: 0,
    })
    beforeEach(() => {
      cy.clock(mockedTime.toMillis())
      cy.intercept('POST', '/appointment/is-in-past', {
        statusCode: 200,
        body: { isInPast: true },
      }).as('isInPast')
      loadDateTimePage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('08:00')
    })
    it('should display the log an outcome alert banner', () => {
      cy.wait('@isInPast')
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
  })
  describe('Todays date is selected from the picker, and a start time in the future is entered', () => {
    const mockedTime = DateTime.local().set({
      hour: 9,
      minute: 1,
      second: 0,
      millisecond: 0,
    })
    beforeEach(() => {
      cy.clock(mockedTime.toMillis())
      cy.intercept('POST', '/appointment/is-in-past', {
        statusCode: 200,
        body: { isInPast: false },
      }).as('isInPast')
      loadDateTimePage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('10:00')
    })
    it('should not display the log an outcome alert banner', () => {
      cy.wait('@isInPast')
      cy.get('[data-module="serviceAlert"]').should('not.be.visible')
    })
  })
  describe('Date in the past is selected', () => {
    const mockedTime = DateTime.local().set({
      hour: 9,
      minute: 1,
      second: 0,
      millisecond: 0,
    })
    const now = DateTime.now()
    const yesterday = now.minus({ days: 1 })
    const yesterdayIsInCurrentMonth = yesterday.month === now.month

    const selectPastDate = () => {
      locationDateTimePage.getDatePickerToggle().click()
      if (!yesterdayIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
      cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).click()
    }

    beforeEach(() => {
      cy.clock(mockedTime.toMillis())
      cy.intercept('POST', '/appointment/is-in-past', {
        statusCode: 200,
        body: { isInPast: true },
      }).as('isInPast')
      loadDateTimePage()
    })
    it('should persist the log an outcome alert banner when form is submitted with validation errors', () => {
      selectPastDate()
      cy.get('[data-module="serviceAlert"]').should('be.visible')
      locationDateTimePage.getSubmitBtn().click()
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
    it('should redirect to the log an outcome page if date in past submitted', () => {
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage = new AttendedCompliedPage()
      logOutcomePage.checkOnPage()
    })

    it('should persist the log an outcome alert banner when past date is submitted and cancel and go back link is clicked from log an outcome page', () => {
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage = new AttendedCompliedPage()
      logOutcomePage.checkOnPage()
      logOutcomePage.getCancelGoBackLink().click()
      locationDateTimePage.checkOnPage()
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
    it('should persist the log an outcome banner when change link is clicked on check your answers page', () => {
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      completeAttendedCompliedPage()
      completeAddNotePage()
      const page = new AppointmentCheckYourAnswersPage()
      page.getSummaryListRow(5).find('.govuk-link').click()
      cy.get('[data-module="serviceAlert"]').should('be.visible')
    })
  })
})
