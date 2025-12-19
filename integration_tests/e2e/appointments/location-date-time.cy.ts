import { DateTime } from 'luxon'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import {
  completeSentencePage,
  completeTypePage,
  crn,
  uuid,
  checkPopHeader,
  completeAttendedCompliedPage,
  completeAddNotePage,
  completeSupportingInformationPage,
} from './imports'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'

const loadPage = (typeOptionIndex = 1) => {
  completeSentencePage()
  completeTypePage(typeOptionIndex)
}

describe('Pick a date, location and time for this appointment', () => {
  let locationDateTimePage: AppointmentLocationDateTimePage
  let logOutcomePage: AttendancePage
  let locationNotInListPage: AppointmentLocationNotInListPage
  let notePage: AppointmentNotePage
  let cyaPage: AppointmentCheckYourAnswersPage

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
    cy.task('resetMocks')
  })
  describe('Page is rendered with options for an appointment type which requires a location', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
    })
    it('should render the pop header', () => {
      checkPopHeader('Alton Berge', true)
    })
    it('should display the options', () => {
      locationDateTimePage.getRadioLabel('locationCode', 1).should('contain.text', 'Hmp Wakefield')
      locationDateTimePage.getRadioLabel('locationCode', 2).should('contain.text', '102 Petty France')
      locationDateTimePage.getRadioLabel('locationCode', 3).should('contain.text', 'The Building')
      locationDateTimePage
        .getRadioLabel('locationCode', 5)
        .should('contain.text', 'The location I’m looking for is not in this list')
    })
    it('should display the continue button', () => {
      locationDateTimePage.getSubmitBtn().should('contain.text', 'Continue')
    })
    it('should display the circumstances link', () => {
      locationDateTimePage.getSummaryLink().should('contain.text', `Alton’s circumstances`)
    })
    it('should display the circumstances', () => {
      locationDateTimePage.getSummaryLink().click()
      locationDateTimePage.getPersonalCircumstance('disability').find('dt').should('contain.text', 'Disability')
      locationDateTimePage
        .getPersonalCircumstance('disability')
        .find('dd')
        .should('contain.text', 'Hearing Disabilities')
        .should('contain.text', 'Learning Disability')
        .should('contain.text', 'Mental Health related disabilities')
        .should('contain.text', 'Mobility related Disabilities')
      locationDateTimePage
        .getPersonalCircumstance('provisions')
        .find('dt')
        .should('contain.text', 'Reasonable adjustments')
      locationDateTimePage
        .getPersonalCircumstance('provisions')
        .find('dd')
        .should('contain.text', 'Handrails')
        .should('contain.text', 'Behavioural responses/Body language')
      locationDateTimePage.getPersonalCircumstance('dependents').find('dt').should('contain.text', 'Dependents')
      locationDateTimePage.getPersonalCircumstance('dependents').find('dd').should('contain.text', 'Has Dependents')
      locationDateTimePage.getPersonalCircumstance('employment').find('dt').should('contain.text', 'Employment')
      locationDateTimePage
        .getPersonalCircumstance('employment')
        .find('dd')
        .should('contain.text', 'Volunteering')
        .should('contain.text', 'Full Time Employed')
      locationDateTimePage.getPersonalCircumstance('relationship').find('dt').should('contain.text', 'Relationship')
      locationDateTimePage
        .getPersonalCircumstance('relationship')
        .find('dd')
        .should('contain.text', 'Married / Civil partnership')
    })
  })
  describe('Page is rendered with options for an appointment type which does not require a location', () => {
    beforeEach(() => {
      const typeOptionIndex = 2
      loadPage(typeOptionIndex)
      locationDateTimePage = new AppointmentLocationDateTimePage()
    })
    it('should display the non-mandatory location option', () => {
      locationDateTimePage.getRadioLabel('locationCode', 6).should('contain.text', 'I do not need to pick a location')
    })
  })

  describe('Page is rendered with no locations for an appointment type which requires a location', () => {
    it('should redirect to the location not in list page', () => {
      cy.task('stubNoUserLocationsFound')
      loadPage()
      locationNotInListPage = new AppointmentLocationNotInListPage()
      locationNotInListPage.checkOnPage()
    })
  })
  describe('Page is rendered with no locations for an appointment type which does not require a location', () => {
    it('should only display the last 2 radio options', () => {
      cy.task('stubNoUserLocationsFound')
      const typeOptionIndex = 2
      loadPage(typeOptionIndex)
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage
        .getRadioLabel('locationCode', 1)
        .should('contain.text', 'The location I’m looking for is not in this list')
      locationDateTimePage.getRadioLabel('locationCode', 2).should('contain.text', 'I do not need to pick a location')
      cy.get('[data-qa="locationOption"]').should('not.exist')
    })
    it('should not display the radio list divider', () => {
      cy.get('.govuk-radios__divider').should('not.exist')
    })
  })

  describe('Back link is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getBackLink().click()
    })
    it('should render the appointmentType page', () => {
      const appointmentTypePage = new AppointmentTypePage()
      appointmentTypePage.checkOnPage()
    })
  })

  describe('Continue is clicked without selecting anything', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox([
        'Enter or select a date',
        'Enter a start time',
        'Enter an end time',
        'Select an appointment location',
      ])
    })
    it('should display the error messages', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Enter or select a date')
      })
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
        expect($error.text().trim()).to.include('Enter a start time')
      })
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('Enter an end time')
      })
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment location')
      })
    })
    it('should focus the location radio button when the location summary link is clicked', () => {
      locationDateTimePage.getErrorSummaryLink(3).click()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).should('be.focused')
    })
  })

  describe('Continue is clicked, when end-time was before start time', () => {
    const mockedTime = DateTime.local().set({
      hour: 9,
      minute: 1,
      second: 0,
      millisecond: 0,
    })
    const mockedNow = mockedTime.toUTC().toISO()
    before(() => {
      // set the mocked time on the back end
      cy.request({
        method: 'POST',
        url: 'http://localhost:3007/__test/set-mocked-time',
        body: { time: mockedNow },
      })
    })
    beforeEach(() => {
      cy.clock(DateTime.fromISO(mockedNow).toMillis())
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('9:10')
      locationDateTimePage.getElementInput(`endTime`).focus().type('08:30')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox([
        'Enter a time in the 24-hour format, for example 16:30',
        'The end time must be after the start time',
      ])
    })
    it('should display the error messages incorrect 24 hours time format', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
        expect($error.text().trim()).to.include('Enter a time in the 24-hour format, for example 16:30')
      })
    })
    it('should display the error messages end time before start time', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
    })
  })

  describe('Continue is clicked entering a date which is invalid', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerInput().clear().type('xxxxxxxx')
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('10:30')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox(['Enter a date in the correct format, for example 17/5/2024'])
    })
    it('should display the error messages', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Enter a date in the correct format, for example 17/5/2024')
      })
    })
  })

  describe('Continue is clicked selecting an end time the same as the start time', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('09:30')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])
    })
    it('should display the error messages', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
    })
  })

  describe('Continue is clicked selecting an end time before the start time', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('10:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:00')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box again', () => {
      locationDateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])
    })
    it('should display the error messages again', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
    })
  })

  describe('Continue is clicked selecting a date and time that clashes', () => {
    beforeEach(() => {
      cy.task('stubAppointmentClash')
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('11:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('11:15')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the overlapping appointment warning', () => {
      cy.get('[data-qa=overlapsWithMeetingWith]')
        .should('be.visible')
        .should(
          'contain.text',
          'Alton has an existing appointment at 11am to 12pm that overlaps with this time. Continue with these details or make changes',
        )
    })
  })

  describe('Continue is clicked entering a date which is later than 31/12/2199', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerInput().clear().type('1/1/2200')
      locationDateTimePage.getElementInput(`startTime`).clear().type('10:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('11:00')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox(['The date must not be later than 31/12/2199'])
    })
    it('should display the error messages', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('The date must not be later than 31/12/2199')
      })
    })
  })

  describe('Date is selected', () => {
    const value = DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy')
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
    })
    it('should display the date value in the field', () => {
      locationDateTimePage.getDatePickerInput().should('have.value', value)
    })
  })

  describe('Date is selected from the picker which is in the past', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getDatePickerToggle().click()
      if (!yesterdayIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
      cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).click()
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
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
        locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
      })
    })
  })

  describe('Date is entered which is in the past', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getDatePickerInput().type(`${yesterday.toFormat('d/M/yyyy')}`)
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should hide the alert banner if a date is entered in the future', () => {
      const tomorrow = now.plus({ days: 1 }).toFormat('d/M/yyyy')
      locationDateTimePage.getDatePickerInput().clear().type(tomorrow)
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
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
      loadPage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('08:00')
    })
    it('should display the log an outcome alert banner', () => {
      cy.wait('@isInPast')
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
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
      loadPage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).type('10:00')
    })
    it('should not display the log an outcome alert banner', () => {
      cy.wait('@isInPast')
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
  })
  describe('Date in the past is selected', () => {
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
      loadPage()
    })
    it('should persist the log an outcome alert banner when form is submitted with validation errors', () => {
      selectPastDate()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should persist the log an outcome alert banner when past date is submitted and cancel and go back link is clicked from log an outcome page', () => {
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage = new AttendedCompliedPage()
      logOutcomePage.checkPageTitle('Confirm Alton attended and complied')
      logOutcomePage.getCancelGoBackLink().click()
      locationDateTimePage.checkOnPage()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
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
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(5).find('.govuk-link').click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
  })

  describe('Date in the past is selected, the the alert banner is dismissed', () => {
    beforeEach(() => {
      loadPage()
      selectPastDate()
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should hide the banner if dismiss link is clicked', () => {
      cy.get('.moj-alert__dismiss').click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
    it('should not re-show the alert banner when invalid form is submitted and validation errors are shown', () => {
      cy.get('.moj-alert__dismiss').click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
    it('should not re-show the alert banner when the form is submitted, then the back link is clicked on the next page', () => {
      cy.get('.moj-alert__dismiss').click()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage.getCancelGoBackLink().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
  })

  describe('Location and date in future are selected, then continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      const tomorrow = now.plus({ days: 1 })
      const tomorrowIsInCurrentMonth = tomorrow.month === now.month
      locationDateTimePage.getDatePickerToggle().click()
      if (!tomorrowIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
      cy.get(`[data-testid="${tomorrow.toFormat('d/M/yyyy')}"]`).click()
      locationDateTimePage.getElementInput(`startTime`).type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().type('09:30')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage
        .getWarning('isWithinOneHourOfMeetingWith')
        .should(
          'contain.text',
          'Alma Barlow already has an appointment with Alton within an hour of this date and time. Continue with these details or make changes.',
        )
      locationDateTimePage
        .getWarning('nonWorkingDayName')
        .should(
          'contain.text',
          'You have selected a non-working day (Sunday). Continue with these details or make changes.',
        )
      locationDateTimePage.getSubmitBtn().click()
    })

    it('should redirect to the supporting information, then cya page', () => {
      notePage = new AppointmentNotePage()
      notePage.checkOnPage()
      completeSupportingInformationPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkOnPage()
    })
  })
  describe('Past appointments feature flag disabled', () => {
    beforeEach(() => {
      cy.task('stubDisablePastAppointments')
      loadPage()
    })
    it('disable all past dates in the date picker', () => {
      locationDateTimePage.getDatePickerToggle().click()
      if (!yesterdayIsInCurrentMonth) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
      cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).should('have.attr', 'aria-disabled', 'true')
    })
    it('should display validation error when past date entered', () => {
      locationDateTimePage.getDatePickerInput().clear().type(yesterday.toFormat('d/M/yyyy'))
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.checkErrorSummaryBox([
        'Date must be today or in the future',
        'Enter a start time',
        'Enter an end time',
      ])
    })
    it('should show validation error if today and start time in the past entered', () => {
      const mockedTime = DateTime.local().set({
        hour: 9,
        minute: 1,
        second: 0,
        millisecond: 0,
      })
      const mockedNow = mockedTime.toUTC().toISO()
      cy.request({
        method: 'POST',
        url: 'http://localhost:3007/__test/set-mocked-time',
        body: { time: mockedNow },
      })
      cy.clock(DateTime.fromISO(mockedNow).toMillis())
      locationDateTimePage.getDatePickerInput().clear().type(now.toFormat('d/M/yyyy'))
      locationDateTimePage.getElementInput(`startTime`).type('08:10')
      locationDateTimePage.getElementInput(`endTime`).focus().type('08:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.checkErrorSummaryBox(['The start time must be now or in the future'])
    })
    it('should not display the alert banner when a past appointment is entered', () => {
      locationDateTimePage.getDatePickerInput().clear().type(yesterday.toFormat('d/M/yyyy'))
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
  })
})
