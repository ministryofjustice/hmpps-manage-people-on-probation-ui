import { DateTime } from 'luxon'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import { crn, startTime, endTime } from './common'
import { getUuid, completeTextMessageConfirmationPage, completeSupportingInformationPage } from '../utils'

export const checkUpdateLocation = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(4).find('.govuk-link').click()
  const locationPage = new AppointmentLocationDateTimePage()
  locationPage.getRadio('locationCode', 2).click()
  const future = DateTime.now().plus({ days: 2 })
  locationPage
    .getDatePickerInput()
    .clear()
    .type(`${future.toFormat('d/M/yyyy')}`)
  getUuid().then(uuidOveride => {
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-start`).clear().type(startTime)
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-end`).focus().clear().type(endTime)
  })
  locationPage.getSubmitBtn().click()
  locationPage.getSubmitBtn().click()
  if (!(page instanceof AppointmentCheckYourAnswersPage)) {
    getUuid().then(pageUuid => {
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage(true, '', pageUuid)
    })
  }
  if (page instanceof AppointmentCheckYourAnswersPage) {
    page.checkPageTitle('Check your answers then confirm the appointment')
  } else {
    page.checkOnPage()
  }
  page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
}
