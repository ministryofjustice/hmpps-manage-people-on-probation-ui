import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { checkPopHeader } from './imports'

const crn = 'X000001'
const appointmentId = '2'

const loadPage = (id = appointmentId) => {
  cy.visit(`/case/${crn}/appointments/appointment/${id}/next-appointment`)
}

// Logs a named step (Given / When / Then / And) in the Cypress command log, so a failure shows which step it was
const step = (name: string, fn: () => void) => {
  cy.log(`**${name}**`)
  fn()
}

describe('Create next appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('validates the form, then returns to manage when the practitioner declines another appointment', () => {
    let nextAppointmentPage: NextAppointmentPage

    step('Given I am on the next appointment page', () => {
      loadPage()
      nextAppointmentPage = new NextAppointmentPage()
      checkPopHeader()
    })

    step('When I submit without selecting an option, then I see a validation error', () => {
      nextAppointmentPage.getSubmitBtn().click()
      nextAppointmentPage.getErrorSummaryBox().should('be.visible')
    })

    step('When I select "No" and submit, then I am returned to the manage appointment page', () => {
      nextAppointmentPage.getRadio('anotherAppointment', 3).click()
      nextAppointmentPage.getSubmitBtn().click()
      const manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with George Parker')
      manageAppointmentPage.checkOnPage()
    })
  })

  it('redirects to the sentence/person page when arranging a different appointment type', () => {
    step('Given I am on the next appointment page', () => {
      loadPage('6')
    })

    step('When I select a different appointment type and submit, then I am sent to the sentence page', () => {
      const nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('anotherAppointment', 2).click()
      nextAppointmentPage.getSubmitBtn().click()
      new AppointmentSentencePage().checkOnPage()
    })
  })

  it('carries the appointment over to the arrange another appointment page when keeping the same type', () => {
    step('Given I am on the next appointment page', () => {
      cy.task('stubAppointmentNoEventId')
      loadPage('6')
    })

    step('When I select the same appointment type and submit, then I am sent to arrange another appointment', () => {
      const nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('anotherAppointment', 1).click()
      nextAppointmentPage.getSubmitBtn().click()
      new ArrangeAnotherAppointmentPage().checkOnPage()
    })
  })
})
