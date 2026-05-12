import AddNotePage from '../../../pages/appointments/add-note.page'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentNotePage from '../../../pages/appointments/note.page'
import { crn } from './common'
import { getUuid, completeLocationDateTimePage, completeTextMessageConfirmationPage } from '../utils'

export const checkUpdateSensitivity = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  dateInPast = false,
  sendTextMessage = true,
) => {
  getUuid().then(pageUuid => {
    const index = !dateInPast && sendTextMessage ? 8 : 7
    page.getSummaryListRow(index).find('.govuk-link').click()
    const notePage = dateInPast ? new AddNotePage() : new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${pageUuid}-sensitivity-2`).click()
    notePage.getSubmitBtn().click()
    if (page instanceof ArrangeAnotherAppointmentPage) {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
    }
    if (page instanceof AppointmentCheckYourAnswersPage) {
      page.checkPageTitle('Check your answers then confirm the appointment')
    } else {
      page.checkOnPage()
    }
    page.getSummaryListRow(index).find('.govuk-summary-list__value').should('contain.text', 'No')
  })
}
