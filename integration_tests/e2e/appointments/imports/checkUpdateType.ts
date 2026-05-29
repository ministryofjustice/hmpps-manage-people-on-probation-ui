import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentTypePage from '../../../pages/appointments/type.page'
import { crn } from './common'
import {
  getUuid,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
  completeSupportingInformationPage,
} from '../utils'

export const checkUpdateType = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(2).find('.govuk-link').click()
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', 2).click()
  typePage.getSubmitBtn().click()
  if (page instanceof ArrangeAnotherAppointmentPage) {
    getUuid().then(pageUuid => {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage({ notes: true, uuidOveride: pageUuid })
    })
  }
  page.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Planned telephone contact (NS)')
}
