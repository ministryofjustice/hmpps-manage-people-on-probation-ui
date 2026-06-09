import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentSentencePage from '../../../pages/appointments/sentence.page'

import {
  getUuid,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
  completeSupportingInformationPage,
} from '../utils'
import { crn } from './common'

export const checkUpdateSentence = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    page.getSummaryListRow(1).find('.govuk-link').click()
    const sentencePage = new AppointmentSentencePage()
    sentencePage.getElement(`#appointments-${crn}-${pageUuid}-eventId-2`).click()
    sentencePage.getSubmitBtn().click()
    if (!(page instanceof AppointmentCheckYourAnswersPage)) {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage({ notes: true, uuidOveride: pageUuid })
    }
    if (page instanceof AppointmentCheckYourAnswersPage) {
      page.checkPageTitle('Check your answers then confirm the appointment')
    } else {
      page.checkOnPage()
    }
    if (page instanceof AppointmentCheckYourAnswersPage) {
      page.checkPageTitle('Check your answers then confirm the appointment')
    } else {
      page.checkOnPage()
    }
  })
}
