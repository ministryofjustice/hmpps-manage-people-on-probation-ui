import { DateTime } from 'luxon'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import {
  completeAttendancePage,
  completeLocationPage,
  completeSentencePage,
  completeTypePage,
  crn,
  uuid,
  checkPopHeader,
} from './imports'

const loadPage = (date?: DateTime<true>) => {
  completeTypePage(1, '', false, '', date)
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
}
describe('Enter the date and time of the appointment', () => {
  let dateTimePage: AppointmentDateTimePage
  let repeatingPage: AppointmentRepeatingPage
  afterEach(() => {
    cy.task('resetMocks')
  })

  describe('Page is rendered', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.getSummaryLink().click()
    })
    it('should render the pop header', () => {
      checkPopHeader('Alton Berge', true)
    })
    it('should display the circumstances link', () => {
      dateTimePage.getSummaryLink().should('contain.text', `Alton’s circumstances`)
    })
    it('should display the circumstances', () => {
      dateTimePage.getSummaryLink().click()
      dateTimePage.getDisability().find('dt').should('contain.text', 'Disability')
      dateTimePage.getDisability().find('dd').should('contain.text', 'Hearing Disabilities')
      dateTimePage.getDisability().find('dd').should('contain.text', 'Learning Disability')
      dateTimePage.getDisability().find('dd').should('contain.text', 'Mental Health related disabilities')
      dateTimePage.getDisability().find('dd').should('contain.text', 'Mobility related Disabilities')
      dateTimePage.getReasonableAdjustments().find('dt').should('contain.text', 'Reasonable adjustments')
      dateTimePage.getReasonableAdjustments().find('dd').should('contain.text', 'Handrails')
      dateTimePage.getReasonableAdjustments().find('dd').should('contain.text', 'Behavioural responses/Body language')
      dateTimePage.getDependents().find('dt').should('contain.text', 'Dependents')
      dateTimePage.getDependents().find('dd').should('contain.text', 'None known')
    })
  })

  describe('Back link is clicked', () => {
    let locationPage: AppointmentLocationPage
    beforeEach(() => {
      loadPage()
      dateTimePage.getBackLink().click()
      locationPage = new AppointmentLocationPage()
    })
    it('should render the locations page', () => {
      locationPage.checkOnPage()
    })
    it('should persist the location selection', () => {
      locationPage.getRadio('locationCode', 1).should('be.checked')
    })
  })

  describe('Continue is clicked without selecting a date or time', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['Enter or select a date', 'Select a start time', 'Select an end time'])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Enter or select a date')
      })
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
        expect($error.text().trim()).to.include('Select a start time')
      })
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('Select an end time')
      })
    })
  })

  describe('Continue is clicked selecting a start time which is in the past', () => {
    beforeEach(() => {
      const newDate = DateTime.now().set({
        hour: 9,
        minute: 30,
        second: 0,
        millisecond: 0,
      })
      loadPage(newDate)
      // cy.clock(newDate.toMillis())
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('9:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('9:30am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['The start time must be now or in the future'])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
        expect($error.text().trim()).to.include('The start time must be now or in the future')
      })
    })
  })

  describe('Continue is clicked entering a date which is invalid', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerInput().clear().type('xxxxxxxx')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('10:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('11:00am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['Enter a date in the correct format, for example 17/5/2024'])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Enter a date in the correct format, for example 17/5/2024')
      })
    })
  })

  describe('Continue is clicked selecting an end time the same as the start time', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('9:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('9:00am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
    })
  })

  describe('Continue is clicked selecting an end time before the start time', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('10:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('9:00am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box again', () => {
      dateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])
    })
    it('should display the error messages again', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
        expect($error.text().trim()).to.include('The end time must be after the start time')
      })
    })
  })

  describe('Continue is clicked selecting a date and time that clashes', () => {
    beforeEach(() => {
      cy.task('stubAppointmentClash')
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('11:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('11:15am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox([
        'Choose a time that does not clash with Alton’s existing appointment at 11am to 12pm',
      ])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
        expect($error.text().trim()).to.include(
          'Choose a time that does not clash with Alton’s existing appointment at 11am to 12pm',
        )
      })
    })
  })

  describe('Continue is clicked entering a date which is later than 31/12/2199', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerInput().type('1/1/2200')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('10:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('11:00am')
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['The date must not be later than 31/12/2199'])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('The date must not be later than 31/12/2199')
      })
    })
  })

  describe('Date is selected', () => {
    const value = DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy')
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
    })
    it('should display the date value in the field', () => {
      dateTimePage.getDatePickerInput().should('have.value', value)
    })
  })
  describe('Start time and end time are selected, continue is clicked - warnings are displayed first', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getNextDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select('9:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select('9:30am')
      dateTimePage.getSubmitBtn().click()
      dateTimePage
        .getWarning('isWithinOneHourOfMeetingWith')
        .should(
          'contain.text',
          'Alma Barlow already has an appointment with Alton within an hour of this date and time. Continue with these details or make changes.',
        )
      dateTimePage
        .getWarning('nonWorkingDayName')
        .should(
          'contain.text',
          'You have selected a non-working day (Sunday). Continue with these details or make changes.',
        )
      dateTimePage.getSubmitBtn().click()
    })
    it('should redirect to the appointment repeating page', () => {
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.checkOnPage()
    })
  })
})
