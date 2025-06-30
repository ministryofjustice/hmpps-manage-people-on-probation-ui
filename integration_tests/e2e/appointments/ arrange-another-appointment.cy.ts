import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
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
    checkAppointmentSummary(arrangeAnotherAppointmentPage)
    arrangeAnotherAppointmentPage.getSubmitBtn().should('include.text', 'Arrange appointment')
  })
  it('should link to the date/time page and display validation errors if the user clicks submit without selecting a schedule', () => {
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
  })
})
