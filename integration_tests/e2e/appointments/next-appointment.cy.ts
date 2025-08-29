import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import { checkAppointmentDetails, checkPopHeader } from './imports'

const crn = 'X000001'
const appointmentId = '2'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/next-appointment`)
}

describe('Create next appointment', () => {
  let nextAppointmentPage: NextAppointmentPage
  beforeEach(() => {
    cy.task('resetMocks')
    loadPage()
    nextAppointmentPage = new NextAppointmentPage()
  })

  it('should render the pop header', () => {
    checkPopHeader('Caroline Wolff', false)
  })
  it('should display the options', () => {
    nextAppointmentPage.getRadioLabel('option', 1).should('contain.text', 'Yes - another Planned Video Contact (NS)')
    nextAppointmentPage.getRadioLabel('option', 2).should('contain.text', 'Yes - another appointment type')
    nextAppointmentPage.getRadioLabel('option', 3).should('contain.text', 'No')
  })

  it('should give error if no selection made', () => {
    loadPage()
    nextAppointmentPage.getSubmitBtn().click()
    nextAppointmentPage.getErrorSummaryBox().should('be.visible')
  })

  // distinguish these 2 cases
  it('should go to arrange another appointment page if top option selected', () => {
    nextAppointmentPage.getRadio('option', 1).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
  })

  it('should go to arrange another appointment page if middle option selected', () => {
    nextAppointmentPage.getRadio('option', 2).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
  })

  it('should return to manage if no selected', () => {
    nextAppointmentPage.getRadio('option', 3).click()
    nextAppointmentPage.getSubmitBtn().click()
    const manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.setPageTitle('Manage Planned Video Contact (NS) with William Philips')
    manageAppointmentPage.checkOnPage()
  })
})
