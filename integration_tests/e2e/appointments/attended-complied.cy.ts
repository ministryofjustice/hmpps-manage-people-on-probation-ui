import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'

const crn = 'X778160'
const appointmentId = '6'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
}

describe('Attended and complied', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let recordAnOutcomePage: AttendedCompliedPage
  let addNotePage: AddNotePage

  beforeEach(() => {
    cy.task('resetMocks')
    cy.task('stubPastAppointmentNoOutcomeNoNotes')
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  })

  it('should link to the attended and complied page', () => {
    recordAnOutcomePage = new AttendedCompliedPage()
  })

  it('should render page with correct elements', () => {
    cy.get('#outcomeRecorded-hint').should(
      'contain.text',
      'Appointment: 3 Way Meeting (NS) with Terry Jones on 21 February 2024.',
    )

    cy.get('label[for="outcomeRecorded"]').should('contain.text', 'Yes, Eula attended and complied')
  })

  it('should return to management appointment when cancel link is clicked', () => {
    cy.get(`[data-qa="cancel-and-go-back-link"]`).click()
    manageAppointmentPage = new ManageAppointmentPage()
  })

  it('should reveal validation error if the user submits without selecting the checkbox', () => {
    recordAnOutcomePage.getSubmitBtn().click()

    recordAnOutcomePage.checkErrorSummaryBox(['Select if they attended and complied'])

    recordAnOutcomePage.getElement('#outcomeRecorded-error').should($error => {
      expect($error.text().trim()).to.include('Select if they attended and complied')
    })
  })

  it('should navigate to add appointment notes if the user submits after selecting the checkbox', () => {
    cy.get('#outcomeRecorded').click()
    recordAnOutcomePage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
  })
})
