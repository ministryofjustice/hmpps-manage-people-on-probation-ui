import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import RecordAnOutcomePage from '../../pages/appointments/record-an-outcome.page'
import { checkAppointmentDetails, uuid } from './imports'

const crn = 'X778160'
const appointmentId = '6'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
}

describe('Record an outcome', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let recordAnOutcomePage: RecordAnOutcomePage

  beforeEach(() => {
    cy.task('resetMocks')
    cy.task('stubPastAppointmentNoOutcomeNoNotes')
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  })

  it('should link to record-an-outcome page', () => {
    recordAnOutcomePage = new RecordAnOutcomePage()
  })

  it('should render page with correct elements', () => {
    cy.get('#outcomeRecorded-hint').should(
      'contain.text',
      'Appointment: 3 Way Meeting (NS) with Terry Jones on 21 February 2024.',
    )

    cy.get('label[for="outcomeRecorded"]').should('contain.text', 'Yes, Eula attended and complied')
  })

  it('should return to management appointment when cancel link is clicked', () => {
    cy.get('.govuk-link').should('contain.text', 'Cancel and go back').click()
    manageAppointmentPage = new ManageAppointmentPage()
  })

  it('should reveal validation error if the user submits without selecting the checkbox', () => {
    recordAnOutcomePage.getSubmitBtn().click()

    recordAnOutcomePage.checkErrorSummaryBox(['Select if they attended and complied'])

    recordAnOutcomePage.getElement('#outcomeRecorded-error').should($error => {
      expect($error.text().trim()).to.include('Select if they attended and complied')
    })
  })

  it('should navigate to management appointment if the user submits after selecting the checkbox', () => {
    cy.get('#outcomeRecorded').click()

    recordAnOutcomePage.getSubmitBtn().click()

    manageAppointmentPage = new ManageAppointmentPage()
  })
})
