import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import {
  completeTypePage,
  completeSentencePage,
  completeAttendancePage,
  completeLocationPage,
  completeDateTimePage,
  completeRepeatingPage,
  completeNotePage,
  completeCYAPage,
  completeConfirmationPage,
  checkAppointmentSummary,
  checkAppointmentUpdate,
  crn,
  uuid,
} from './imports'

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completeNotePage()
  completeCYAPage()
  completeConfirmationPage()
}
describe('Arrange another appointment', () => {
  beforeEach(() => {
    loadPage()
  })
  it('should render the page', () => {
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    cy.get('p').should(
      'contain.text',
      'Use the saved details of your recently created appointment to create a new one. You can amend any of the details.',
    )
    // checkAppointmentSummary(arrangeAnotherAppointmentPage)
    arrangeAnotherAppointmentPage.getSubmitBtn().should('include.text', 'Arrange appointment')
  })
  /*
  describe('User clicks submit without selecting a date and time', () => {
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    const dateTimePage = new AppointmentDateTimePage()
    beforeEach(() => {
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    })
    it('should redirect to the date/time page', () => {
      dateTimePage.checkOnPage()
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
    */

  describe('Change appointment values', () => {
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    beforeEach(() => {
      loadPage()
    })
    checkAppointmentUpdate(arrangeAnotherAppointmentPage)
  })
})
