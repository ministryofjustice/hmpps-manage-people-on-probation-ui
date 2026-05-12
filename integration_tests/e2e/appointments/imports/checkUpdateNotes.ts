import AddNotePage from '../../../pages/appointments/add-note.page'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentNotePage from '../../../pages/appointments/note.page'
import { getUuid } from '../utils'
import { crn } from './common'

export const checkUpdateNotes = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  dateInPast = false,
  sendTextMessage = true,
) => {
  getUuid().then(pageUuid => {
    const index = !dateInPast && sendTextMessage ? 7 : 6
    page.getSummaryListRow(index).find('.govuk-link').click()
    const updatedNotes = 'Some updated notes'
    const notePage = dateInPast ? new AddNotePage() : new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${pageUuid}-notes`).focus().clear().type(updatedNotes)
    notePage.getSubmitBtn().click()
    if (page instanceof AppointmentCheckYourAnswersPage) {
      page.checkPageTitle('Check your answers then confirm the appointment')
    } else {
      page.checkOnPage()
    }
    page.getSummaryListRow(index).find('.govuk-summary-list__value').should('contain.text', updatedNotes)
  })
}
