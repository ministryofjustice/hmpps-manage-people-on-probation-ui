import AppointmentsPage from '../../pages/appointments'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import {
  checkPopHeader,
  completeAttendancePage,
  completeCYAPage,
  completeDateTimePage,
  completeLocationPage,
  completeSupportingInformationPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
} from './imports'

const crn = 'X000001'
const appointmentId = '2'

const loadPage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/next-appointment`)
}
const completeAppointment = () => {
  completeSentencePage()
  completeTypePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completeSupportingInformationPage()
  completeCYAPage()
  // completeConfirmationPage()
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
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with George Parker')
    manageAppointmentPage.checkOnPage()
  })

  it('should give error if no selection made', () => {
    loadPage()
    nextAppointmentPage.getSubmitBtn().click()
    nextAppointmentPage.getErrorSummaryBox().should('be.visible')
  })

  it('should return to manage if no selected', () => {
    nextAppointmentPage.getRadio('option', 3).click()
    nextAppointmentPage.getSubmitBtn().click()
    const manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.checkPageTitle('Manage planned office visit (NS) with George Parker')
    manageAppointmentPage.checkOnPage()
  })

  it('should still work with no component for the appointment', () => {
    cy.visit(`/case/${crn}/appointments/appointment/7/next-appointment`)
    nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.getRadio('option', 3).click()
    nextAppointmentPage.getSubmitBtn().click()
    const manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.checkPageTitle('Manage with Terry Jones')
    manageAppointmentPage.checkOnPage()
  })

  describe('Same appointment type', () => {
    it('should handle a sentence appointment with no eventId', () => {
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
        .should('contain.text', 'Select what the appointment is for first.')

      arrangeAnotherAppointmentPage.getSummaryListRow(2).find('.govuk-summary-list__actions').should('not.exist')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'terry jones (PS-PSO) (Automated Allocation Team, London)')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(4)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Not entered')
        .should('contain.text', 'Select what the appointment is for first.')

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
        .should('not.contain.html', '<span class="govuk-summary-list__hint">')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Choose type')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'terry jones (PS-PSO) (Automated Allocation Team, London)')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(4)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Not entered')
        .should('contain.text', 'Select the appointment type first.')
      arrangeAnotherAppointmentPage.getSummaryListRow(4).find('.govuk-summary-list__actions').should('not.exist')
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
        .should('not.contain.html', '<span class="govuk-summary-list__hint">')
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
        .should('contain.text', 'Select who is attending first.')
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
        .should('contain.text', 'peter parker (PS-PSO) (Automated Allocation Team, London)')
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
    it('should handle person level appointment', () => {
      cy.task('stubAppointmentPersonLevel')
      cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
      nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('option', 1).click()
      nextAppointmentPage.getSubmitBtn().click()
      const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.checkOnPage()
      arrangeAnotherAppointmentPage
        .getSummaryListRow(1)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Caroline')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(1)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Planned doorstep contact (NS)')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'terry jones (PS-PSO) (Automated Allocation Team, London)')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(4)
        .find('.govuk-summary-list__value')
        .should('contain.html', 'The Building<br>77 Some Street<br>Some City Centre<br>London<br>Essex<br>NW10 1EP')
      arrangeAnotherAppointmentPage
        .getSummaryListRow(4)
        .find('.govuk-summary-list__actions')
        .find('a')
        .should('contain.text', 'Change')
    })
  })
  describe('Another appointment type', () => {
    let sentencePage: AppointmentSentencePage
    let confirmPage: AppointmentConfirmationPage
    let appointmentsPage: AppointmentsPage
    beforeEach(() => {
      cy.visit(`/case/${crn}/appointments/appointment/6/next-appointment`)
      nextAppointmentPage = new NextAppointmentPage()
      nextAppointmentPage.getRadio('option', 2).click()
      nextAppointmentPage.getSubmitBtn().click()
    })
    it('should redirect to the sentence/person page', () => {
      sentencePage = new AppointmentSentencePage()
      sentencePage.checkOnPage()
    })
    it('should post next appointment and redirect to confirmation, then goto appointments page when finish is clicked', () => {
      completeAppointment()
      confirmPage = new AppointmentConfirmationPage()
      confirmPage.checkOnPage()
      cy.get('[data-qa="finishLink"]').click()
      appointmentsPage = new AppointmentsPage()
      appointmentsPage.checkOnPage()
    })
  })
})
