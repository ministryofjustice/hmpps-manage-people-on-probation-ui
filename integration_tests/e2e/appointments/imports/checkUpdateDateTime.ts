import { DateTime } from 'luxon'
import { dateWithYear } from '../../../../server/utils'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import {
  completeSupportingInformationPage,
  completeTextMessageConfirmationPage,
  getCrn,
  getUuid,
  to24HourTimeWithMinutes,
} from '../utils'
import { crn } from './common'

export const checkUpdateDateTime = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  current?: DateTime,
) => {
  getCrn().then(pageCrn => {
    getUuid().then(pageUuid => {
      const newDate = DateTime.now().plus({ days: 3 }).set({
        hour: 7,
        minute: 30,
        second: 0,
        millisecond: 0,
      })
      const changedStart = '09:30'
      const changedEnd = '10:30'
      page.getSummaryListRow(5).find('.govuk-link').click()
      const dateTimePage = new AppointmentLocationDateTimePage()
      dateTimePage.getDatePickerInput().clear().type(`${newDate.day}/${newDate.month}/${newDate.year}`)
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-start`).clear()
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-start`).type(changedStart)
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-end`).focus().clear()
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-end`).type(changedEnd)
      // Ignore warnings
      dateTimePage.getSubmitBtn().click()
      dateTimePage.getSubmitBtn().click()
      if (!(page instanceof AppointmentCheckYourAnswersPage)) {
        completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
        completeSupportingInformationPage(true, '', pageUuid)
      }
      page.checkOnPage()
      page
        .getSummaryListRow(5)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          if (normalizedText) {
            expect(normalizedText).to.include(
              `${dateWithYear(newDate.toISODate())} at ${to24HourTimeWithMinutes(changedStart)} to ${to24HourTimeWithMinutes(changedEnd)}`,
            )
          }
        })
    })
  })
}
