import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'
import ConfirmationOutcomePage from '../../pages/appointmentOutcomes/confirmation.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import OverviewPage from '../../pages/overview'
import { appointmentId, crn } from '../appointments/imports/common'
import { completeOutcome, completeAddNotePage } from '../appointments/utils'

let manageAppointmentPage: ManageAppointmentPage
let checkYourAnswersOutcomePage: CheckYourAnswersOutcomePage
let confirmationPage: ConfirmationOutcomePage
let nextAppointmentPage: NextAppointmentPage
let overviewPage: OverviewPage

const loadPage = (): void => {
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome({ outcome: 'ATTENDED_COMPLIED', action: null, letterSentBy: null })
  completeAddNotePage({ journey: 'MANAGE', crnOverride: crn })
  nextAppointmentPage = new NextAppointmentPage()
  cy.get(`.govuk-radios__input[value=NO]`).click()
  nextAppointmentPage.getSubmitBtn().click()
  checkYourAnswersOutcomePage = new AppointmentCheckYourAnswersPage()
  checkYourAnswersOutcomePage.getSubmitBtn().click()
}

describe('Confirmation - outcomes', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    it('should render the page', () => {
      loadPage()
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Appointment outcome updated')
      cy.get('[data-qa=returnToManageAppointment]').should('contain.text', 'Return to manage appointment').click()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage 3 way meeting (NS) with Terry Jones')
      cy.go('back')
      confirmationPage.getSubmitBtn().click()
      overviewPage = new OverviewPage()
      overviewPage.checkOnPage()
      cy.get('[data-qa=name]').should('contain.text', 'Alton Berge')
    })
  })
})
