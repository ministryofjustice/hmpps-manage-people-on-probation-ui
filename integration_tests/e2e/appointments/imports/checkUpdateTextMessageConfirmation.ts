import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import TextMessageConfirmationPage from '../../../pages/appointments/text-message-confirmation.page'
import EditContactDetails from '../../../pages/personalDetails/editContactDetails'
import { getCrn, getUuid } from '../utils'

export const checkUpdateTextMessageConfirmation = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  updateMobileNumber = false,
) => {
  getCrn().then(pageCrn => {
    getUuid().then(pageUuid => {
      const optionIndex = updateMobileNumber ? 2 : 3
      const number = '07703123456'
      page.getSummaryListRow(6).find('.govuk-link').click()
      const textMessageConfirmPage = new TextMessageConfirmationPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${pageCrn}-${pageUuid}-smsOptIn`).should('be.checked')
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${pageCrn}-${pageUuid}-smsOptIn-${optionIndex}`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      if (updateMobileNumber) {
        const editContactDetailsPage = new EditContactDetails()
        editContactDetailsPage.checkOnPage()
        cy.get('[name=phoneNumber]').should('not.exist')
        cy.get('[name=emailAddress]').should('not.exist')
        page.getElementInput('mobileNumber').clear().type('07703123456')
        cy.get('[data-qa=submitBtn]').click()
      }
      page.checkOnPage()
      if (updateMobileNumber) {
        page
          .getSummaryListRow(6)
          .find('.govuk-summary-list__value')
          .should('contain.text', 'Yes')
          .should('contain.text', number)
      } else {
        page
          .getSummaryListRow(6)
          .find('.govuk-summary-list__value')
          .should('contain.text', 'No')
          .should('not.contain.text', number)
      }
    })
  })
}
