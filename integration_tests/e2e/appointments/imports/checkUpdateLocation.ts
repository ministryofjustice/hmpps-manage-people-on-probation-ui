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
  locationPage.getDatePickerInput().clear()
  locationPage.getDatePickerToggle().click()
  const now = DateTime.now()
  const tomorrow = now.plus({ days: 1 })
  if (tomorrow.month !== now.month) {
    cy.get('.moj-js-datepicker-next-month').click()
  }
  cy.get(`[data-testid="${tomorrow.toFormat('d/M/yyyy')}"]`).click()
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
