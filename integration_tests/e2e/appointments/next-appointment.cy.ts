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

describe('Create next appointment', () => {
  let nextAppointmentPage: NextAppointmentPage
  beforeEach(() => {
    cy.task('resetMocks')
  })

  describe('Story: practitioner decides not to arrange another appointment', () => {
    it('should show the page, error on empty submit, then return to manage when "No" is selected', () => {
      loadPage()
      nextAppointmentPage = new NextAppointmentPage()
      checkPopHeader()
      nextAppointmentPage.getSubmitBtn().click()
      nextAppointmentPage.getErrorSummaryBox().should('be.visible')
      nextAppointmentPage.getRadio('anotherAppointment', 3).click()
      nextAppointmentPage.getSubmitBtn().click()
      const manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with George Parker')
      manageAppointmentPage.checkOnPage()
    })
  })

  describe('Story: practitioner arranges another appointment of a different type', () => {
    it('should redirect to the sentence/person page', () => {
      loadPage('6')
      nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('anotherAppointment', 2).click()
      nextAppointmentPage.getSubmitBtn().click()
      new AppointmentSentencePage().checkOnPage()
    })
  })

  describe('Story: practitioner arranges another appointment of the same type', () => {
    it('should carry the appointment over to the arrange another appointment page', () => {
      cy.task('stubAppointmentNoEventId')
      loadPage('6')
      nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('anotherAppointment', 1).click()
      nextAppointmentPage.getSubmitBtn().click()
      new ArrangeAnotherAppointmentPage().checkOnPage()
    })
  })
})
