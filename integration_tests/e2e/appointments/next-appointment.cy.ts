import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { checkPopHeader } from './imports'

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
    nextAppointmentPage.getRadioLabel('option', 1).should('contain.text', 'Yes - another planned office visit (NS)')
    nextAppointmentPage.getRadioLabel('option', 2).should('contain.text', 'Yes - another appointment type')
    nextAppointmentPage.getRadioLabel('option', 3).should('contain.text', 'No')
  })
  it('should return to manage page when backLink selected', () => {
    nextAppointmentPage.getBackLink().click()
    const manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.setPageTitle('Manage Planned Office Visit (NS) with George Parker')
    manageAppointmentPage.checkOnPage()
  })

  it('should give error if no selection made', () => {
    loadPage()
    nextAppointmentPage.getSubmitBtn().click()
    nextAppointmentPage.getErrorSummaryBox().should('be.visible')
  })
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
    manageAppointmentPage.setPageTitle('Manage Planned Office Visit (NS) with George Parker')
    manageAppointmentPage.checkOnPage()
  })

  it('should still work with no component for the appointment', () => {
    cy.visit(`/case/${crn}/appointments/appointment/7/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 3).click()
    nextAppointmentPage.getSubmitBtn().click()
    const manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.setPageTitle('Manage with Terry Jones')
    manageAppointmentPage.checkOnPage()
  })

  it('should handle an appointment with no eventId', () => {
    cy.task('stubAppointmentNoEventId')
    cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 1).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Choose for')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(2).find('.govuk-summary-list__actions').should('not.exist')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(3).find('.govuk-summary-list__actions').should('not.exist')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(4).find('.govuk-summary-list__actions').should('not.exist')
  })
  it('should handle an appointment with no type', () => {
    cy.task('stubAppointmentNoType')
    cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 1).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Default Sentence Type (12 Months)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Choose type')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(3).find('.govuk-summary-list__actions').should('not.exist')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(4).find('.govuk-summary-list__actions').should('not.exist')
  })
  it('should handle an appointment with no attendee', () => {
    cy.task('stubAppointmentNoAttendee')
    cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 1).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Default Sentence Type (12 Months)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', '3 way meeting (NS)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Choose attending')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage.getSummaryListRow(4).find('.govuk-summary-list__actions').should('not.exist')
  })
  it('should handle an appointment with no location', () => {
    cy.task('stubAppointmentNoLocation')
    cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 1).click()
    nextAppointmentPage.getSubmitBtn().click()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.checkOnPage()
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Default Sentence Type (12 Months)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', '3 way meeting (NS)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'george parker (PS-PSO) (Automated Allocation Team North, Greater Manchester)')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Change')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Not entered')
    arrangeAnotherAppointmentPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__actions')
      .find('a')
      .should('contain.text', 'Choose location')
  })
})
