import { DateTime } from 'luxon'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import { checkPopHeader, checkRiskToStaffAlert } from './imports'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'
import { crn, uuid } from './imports/common'
import {
  completeSentencePage,
  completeTypePage,
  completeAttendedCompliedPage,
  completeAddNotePage,
  completeSupportingInformationPage,
  completeRescheduleAppointmentPage,
  getUuid,
} from './utils'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

const loadPage = ({ urlCRN = crn, typeOptionIndex = 1, enableNonCompliance = true } = {}) => {
  if (!enableNonCompliance) {
    cy.task('stubDisableNonCompliance')
  }
  completeSentencePage(1, '', urlCRN)
  completeTypePage(typeOptionIndex)
}

describe('Pick a date, location and time for this appointment', () => {
  let locationDateTimePage: AppointmentLocationDateTimePage
  let logOutcomePage: AttendancePage
  let locationNotInListPage: AppointmentLocationNotInListPage
  let notePage: AppointmentNotePage
  let cyaPage: AppointmentCheckYourAnswersPage
  let textMessageConfirmPage: TextMessageConfirmationPage

  const now = DateTime.now()
  const yesterday = now.minus({ days: 1 })

  const completeDateInFuture = () => {
    locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
    const future = now.plus({ days: 2 })
    locationDateTimePage.getDatePickerInput().type(future.toFormat('d/M/yyyy'))
    locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
    locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
    locationDateTimePage.getSubmitBtn().click()
  }

  const selectPastDate = () => {
    locationDateTimePage.getDatePickerInput().type(yesterday.toFormat('d/M/yyyy'))
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
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
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
  describe('Page is rendered with risk to staff alert', () => {
    beforeEach(() => {
      loadPage({ urlCRN: 'X000001' })
    })
    it('should render the alert with medium risk to staff details', () => {
      checkRiskToStaffAlert('X000001', 'Caroline', 'medium')
    })
  })
  describe('Page is rendered with options for an appointment type which does not require a location', () => {
    beforeEach(() => {
      const typeOptionIndex = 2
      loadPage({ urlCRN: crn, typeOptionIndex })
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
      loadPage({ urlCRN: crn, typeOptionIndex })
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
      locationDateTimePage.getDatePickerInput().clear()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:10')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('08:30')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])

      locationDateTimePage.getBackLink().should('be.visible')
    })
    it('should display the error messages end time before start time', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
      locationDateTimePage.getBackLink().should('be.visible')
    })
  })

  describe('Continue is clicked entering a date which is invalid', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerInput().clear().type('xxxxxxxx')
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('10:30')
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationDateTimePage.checkErrorSummaryBox(['Enter a date in the correct format, for example 17/5/2024'])
    })
    it('should display the error messages', () => {
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Enter a date in the correct format, for example 17/5/2024')
      })
      locationDateTimePage.getBackLink().should('be.visible')
    })
  })

  describe('Continue is clicked selecting an end time the same as the start time', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:30')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
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
      locationDateTimePage.getElementInput(`startTime`).clear().type('10:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:00')
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
      locationDateTimePage.getElementInput(`startTime`).clear().type('11:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('11:15')
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
    const value = DateTime.now().toFormat('d/M/yyyy')
    beforeEach(() => {
      loadPage()
      locationDateTimePage.getDatePickerInput().clear()
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
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getDatePickerInput().clear().type(yesterday.toFormat('d/M/yyyy'))
    })
    it('should not display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
    it('should hide the alert banner if date is selected from the picker in the future', () => {
      const future = now.plus({ days: 2 })
      locationDateTimePage.getDatePickerInput().type(future.toFormat('d/M/yyyy'))
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
  })
  describe('Date is selected from the picker which is in the past - non compliance disabled', () => {
    beforeEach(() => {
      loadPage({ enableNonCompliance: false })
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getDatePickerInput().clear().type(yesterday.toFormat('d/M/yyyy'))
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should hide the alert banner if date is selected from the picker in the future', () => {
      const future = now.plus({ days: 2 })
      locationDateTimePage.getDatePickerInput().clear().type(future.toFormat('d/M/yyyy'))
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
  })

  describe('Date is entered which is in the past', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getDatePickerInput().type(`${yesterday.toFormat('d/M/yyyy')}`)
    })
    it('should not display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
    it('should hide the alert banner if a date is entered in the future', () => {
      const future = now.plus({ days: 2 }).toFormat('d/M/yyyy')
      locationDateTimePage.getDatePickerInput().clear().type(future)
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
  })
  describe('Date is entered which is in the past - non compliance disabled', () => {
    beforeEach(() => {
      loadPage({ enableNonCompliance: false })
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getDatePickerInput().type(`${yesterday.toFormat('d/M/yyyy')}`)
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should hide the alert banner if a date is entered in the future', () => {
      const future = now.plus({ days: 2 }).toFormat('d/M/yyyy')
      locationDateTimePage.getDatePickerInput().clear().type(future)
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
      locationDateTimePage.getElementInput(`startTime`).clear().type('08:00')
    })
    it('should not display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })
  })
  describe('Todays date is selected from the picker, and a start time in the past is entered - non compliance disabled', () => {
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
      loadPage({ enableNonCompliance: false })
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('08:00')
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
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('10:00')
    })
    it('should not display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
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
    })
    it('should not display the warning message', () => {
      loadPage()
      selectPastDate()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.exist')
    })

    it('should display the warning message if enableNonCompliance flag is disabled', () => {
      cy.task('stubDisableNonCompliance')
      loadPage({ enableNonCompliance: false })
      selectPastDate()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })

    it('should persist the log an outcome alert banner when form is submitted with validation errors', () => {
      cy.task('stubDisableNonCompliance')
      loadPage()
      selectPastDate()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })

    it('should persist the log an outcome alert banner when past date is submitted and cancel and go back link is clicked from log an outcome page - non compliance disabled', () => {
      loadPage({ enableNonCompliance: false })
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage = new AttendedCompliedPage()
      logOutcomePage.checkPageTitle('Confirm Alton attended and complied')
      logOutcomePage.getCancelGoBackLink().click()
      locationDateTimePage.checkOnPage()
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should persist the log an outcome banner when change link is clicked on check your answers page - non compliance disabled', () => {
      loadPage({ enableNonCompliance: false })
      selectPastDate()
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
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
      cy.task('stubDisableNonCompliance')
      loadPage()
      selectPastDate()
    })
    it('should display the log an outcome alert banner', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().should('be.visible')
    })
    it('should hide the banner if dismiss link is clicked', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().find('.moj-alert__dismiss').click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
    it('should not re-show the alert banner when invalid form is submitted and validation errors are shown', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().find('.moj-alert__dismiss').click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
    it('should not re-show the alert banner when the form is submitted, then the back link is clicked on the next page', () => {
      locationDateTimePage.getLogOutcomesAlertBanner().find('.moj-alert__dismiss').click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
      locationDateTimePage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      logOutcomePage = new AttendedCompliedPage()
      logOutcomePage.getCancelGoBackLink().click()
      locationDateTimePage.getLogOutcomesAlertBanner().should('not.be.visible')
    })
  })

  describe('Location and date in future are selected, then continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
      completeDateInFuture()
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

    it('should redirect to the text message confirm, supporting information, then cya page', () => {
      textMessageConfirmPage = new TextMessageConfirmationPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      notePage = new AppointmentNotePage()
      notePage.checkOnPage()
      completeSupportingInformationPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkPageTitle('Check your answers')
    })
  })

  describe('Text message confirmation feature flag is disabled', () => {
    beforeEach(() => {
      cy.task('stubDisableSmsReminders')
      loadPage()
      completeDateInFuture()
      locationDateTimePage.getSubmitBtn().click()
    })
    it('should redirect to the supporting info page', () => {
      notePage = new AppointmentNotePage()
      notePage.checkOnPage()
    })
  })

  const completeInvalidRescheduleDateTime = () => {
    completeRescheduleAppointmentPage({ enableNonCompliance: false })
    const rescheduleCyaPage = new RescheduleCheckYourAnswerPage()
    rescheduleCyaPage.getSubmitBtn().click()
    locationDateTimePage = new AppointmentLocationDateTimePage()
    locationDateTimePage.getDatePickerInput().clear().type('21/2/2024')
    locationDateTimePage.getElementInput(`startTime`).clear().type('10:15')
    locationDateTimePage.getElementInput(`endTime`).focus().clear().type('10:30')
    locationDateTimePage.getSubmitBtn().click()
  }

  describe('Rescheduled date', () => {
    const urlCRN = 'X000001'
    beforeEach(() => {
      completeInvalidRescheduleDateTime()
    })
    it('should display the correct validation if rescheduled date, start and end time are the same as original appointment', () => {
      getUuid().then(urlUUID => {
        locationDateTimePage.checkErrorSummaryBox([
          'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is incorrect, select a new date.',
          'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new start time.',
          'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new end time.',
        ])
        locationDateTimePage.getElement(`#appointments-${urlCRN}-${urlUUID}-date-error`).should($error => {
          expect($error.text().trim()).to.include(
            'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is incorrect, select a new date.',
          )
        })
        locationDateTimePage.getElement(`#appointments-${urlCRN}-${urlUUID}-start-error`).should($error => {
          expect($error.text().trim()).to.include(
            'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new start time.',
          )
        })
        locationDateTimePage.getElement(`#appointments-${urlCRN}-${urlUUID}-end-error`).should($error => {
          expect($error.text().trim()).to.include(
            'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new end time.',
          )
        })
      })
    })
    it('should submit the page if date is changed', () => {
      locationDateTimePage.getDatePickerInput().clear().type('22/2/2024')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      const attendedCompliedPage = new AttendedCompliedPage()
      attendedCompliedPage.checkPageTitle('Confirm Caroline attended and complied')
    })
    it('should submit the page if start time is changed', () => {
      locationDateTimePage.getElementInput(`startTime`).clear().type('10:20')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      const attendedCompliedPage = new AttendedCompliedPage()
      attendedCompliedPage.checkPageTitle('Confirm Caroline attended and complied')
    })
    it('should submit the page if end time is changed', () => {
      locationDateTimePage.getElementInput(`endTime`).clear().type('10:40')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      const attendedCompliedPage = new AttendedCompliedPage()
      attendedCompliedPage.checkPageTitle('Confirm Caroline attended and complied')
    })
  })
})
