import { DateTime } from 'luxon'
import { dateWithYear } from '../../../../server/utils'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import {
  completeAddNotePage,
  completeAttendedCompliedPage,
  completeOutcome,
  completeSupportingInformationPage,
  completeTextMessageConfirmationPage,
  getCrn,
  getUuid,
  to24HourTimeWithMinutes,
} from '../utils'
import { crn } from './common'

export const checkUpdateDateTime = ({
  page,
  inPast = false,
  enableNonCompliance = true,
}: {
  page?: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage
  inPast?: boolean
  enableNonCompliance?: boolean
} = {}) => {
  getCrn().then(pageCrn => {
    getUuid().then(pageUuid => {
      const newDate = !inPast
        ? DateTime.now().plus({ days: 3 }).set({
            hour: 7,
            minute: 30,
            second: 0,
            millisecond: 0,
          })
        : DateTime.now().minus({ days: 1 }).set({
            hour: 7,
            minute: 30,
            second: 0,
            millisecond: 0,
          })
      const evidenceDate = !inPast
        ? DateTime.now().plus({ days: 10 }).toFormat('dd MMMM yyyy')
        : DateTime.now().plus({ days: 6 }).toFormat('dd MMMM yyyy')

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
      if (!inPast && page instanceof ArrangeAnotherAppointmentPage) {
        completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
        completeSupportingInformationPage({ notes: true, uuidOveride: pageUuid })
      }
      if (inPast) {
        if (enableNonCompliance) {
          completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
        } else {
          completeAttendedCompliedPage({ _crn: pageCrn, _uuid: pageUuid })
        }
        completeAddNotePage({ idOverride: pageUuid, crnOverride: crn })
      }
      if (page instanceof AppointmentCheckYourAnswersPage) {
        page.checkPageTitle('Check your answers then confirm the appointment')
      } else {
        page.checkOnPage()
      }
      if (inPast) {
        if (enableNonCompliance) {
          completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
        } else {
          completeAttendedCompliedPage({ _crn: pageCrn, _uuid: pageUuid })
        }
        completeAddNotePage({ idOverride: pageUuid, crnOverride: crn })
      }
      if (page instanceof AppointmentCheckYourAnswersPage) {
        page.checkPageTitle('Check your answers then confirm the appointment')
      } else {
        page.checkOnPage()
      }
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
      if (inPast) {
        if (!enableNonCompliance) {
          page.getSummaryListRow(6).find('.govuk-summary-list__key').should('contain.text', 'Attended and complied')
          page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Yes')
        }
        if (enableNonCompliance) {
          page
            .getSummaryListRow(6)
            .find('.govuk-summary-list__key')
            .should('contain.text', 'What was the outcome of this appointment?')
          page
            .getSummaryListRow(6)
            .find('.govuk-summary-list__value')
            .should('contain.text', 'Attended - failed to comply')
          page.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Enforcement action')
          page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'No further action')
          page.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Evidence due date')
          page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', evidenceDate)
        }
      }
    })
  })
}
