import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'

export const checkUpdateBackLinkRefresh = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  const pages = [5, 7]
  cy.wrap(pages).each((index: number) => {
    page.getSummaryListRow(index).find('.govuk-link').click()
    page.getSubmitBtn().click()
    page.getBackLink().click()
    page.checkOnPage()
  })
}
