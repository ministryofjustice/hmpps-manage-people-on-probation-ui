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
} from './imports'

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
}
describe('Enter the date and time of the appointment', () => {
  let dateTimePage: AppointmentDateTimePage
  let repeatingPage: AppointmentRepeatingPage

  describe('Page is rendered', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.getSummaryLink().click()
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
      locationPage.getRadio('location', 1).should('be.checked')
    })
  })

  describe('Continue is clicked without selecting a date or time', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox([
        'Select an appointment date',
        'Select an appointment start time',
        'Select an appointment end time',
      ])
    })
    it('should display the error messages', () => {
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment date')
      })
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-time-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment start time')
      })
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-time-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment end time')
      })
    })
  })

  describe('Date is selected', () => {
    const now = new Date()
    const value = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
    })
    it('should display the date value in the field', () => {
      dateTimePage.getDatePickerInput().should('have.value', value)
    })
  })
  describe('Start time and end time are selected, continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      dateTimePage.getDatePickerToggle().click()
      dateTimePage.getActiveDayButton().click()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-time`).select('9:00am')
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-time`).focus().select('9:30am').tab()
      dateTimePage.getSubmitBtn().click()
    })
    it('should redirect to the appointment repeating page', () => {
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.checkOnPage()
    })
  })
})
