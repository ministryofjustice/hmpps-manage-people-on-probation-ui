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
  locationPage.getDatePickerToggle().click()
  const change = page instanceof AppointmentCheckYourAnswersPage ? DateTime.now().plus({ days: 2 }) : undefined
  locationPage.getNextDayButton(change).click()
  getUuid().then(uuidOveride => {
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-start`).type(startTime)
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-end`).focus().type(endTime)
  })
  locationPage.getSubmitBtn().click()
  locationPage.getSubmitBtn().click()
  if (!(page instanceof AppointmentCheckYourAnswersPage)) {
    getUuid().then(pageUuid => {
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage(true, '', pageUuid)
    })
  }
  page.checkOnPage()
  page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
}
