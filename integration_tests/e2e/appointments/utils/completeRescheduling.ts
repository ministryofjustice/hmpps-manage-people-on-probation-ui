import { DateTime } from 'luxon'
import AddNotePage from '../../../pages/appointments/add-note.page'
import AttendedCompliedPage from '../../../pages/appointments/attended-complied.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import AppointmentNotePage from '../../../pages/appointments/note.page'
import TextMessageConfirmationPage from '../../../pages/appointments/text-message-confirmation.page'
import OutcomePage from '../../../pages/appointmentOutcomes/outcome.page'
import AttendedFailedToComplyPage from '../../../pages/appointmentOutcomes/attended-failed-to-comply.page'

export const completeRescheduling = ({ id = '', inPast = false, enableNonCompliance = false } = {}) => {
  const urlCrn = 'X000001'
  const dateTimePage = new AppointmentLocationDateTimePage()
  const rescheduledStartTime = '09:10'
  const rescheduledEndTime = '10:30'
  let attendedCompliedPage: AttendedCompliedPage
  let addNotePage: AddNotePage
  let outcomePage: OutcomePage
  let supportingInformationPage: AppointmentNotePage
  let textMessageConfirmPage: TextMessageConfirmationPage
  let attendedFailedToComplyPage: AttendedFailedToComplyPage
  const future = DateTime.now().plus({ days: 2 })
  const yesterday = DateTime.now().minus({ days: 1 })
  const appointmentDate = inPast ? yesterday : future
  dateTimePage.getDatePickerInput().clear().type(appointmentDate.toFormat('d/M/yyyy'))
  if (inPast) {
    dateTimePage.getLogOutcomesAlertBanner().should('be.visible')
  }
  dateTimePage.getElementInput(`startTime`).clear().type(rescheduledStartTime)
  dateTimePage.getElementInput(`endTime`).focus().clear().type(rescheduledEndTime)
  dateTimePage.getSubmitBtn().click()
  dateTimePage.getSubmitBtn().click()
  if (inPast) {
    if (!enableNonCompliance) {
      attendedCompliedPage = new AttendedCompliedPage()
      attendedCompliedPage.getLogOutcomesAlertBanner().should('be.visible')
      cy.get('.govuk-checkboxes__input').click()
      attendedCompliedPage.getSubmitBtn().click()
    } else {
      outcomePage = new OutcomePage()
      cy.get(`.govuk-radios__input[value=ATTENDED_FAILED_TO_COMPLY]`).click()
      outcomePage.getSubmitBtn().click()
      attendedFailedToComplyPage = new AttendedFailedToComplyPage()
      cy.get(`.govuk-radios__input[value=NO_FURTHER_ACTION]`).click()
      attendedFailedToComplyPage.getSubmitBtn().click()
    }
    addNotePage = new AddNotePage()
    cy.get(`#appointments-${urlCrn}-${id}-sensitivity-2`).click()
    addNotePage.getSubmitBtn().click()
  } else {
    textMessageConfirmPage = new TextMessageConfirmationPage()
    textMessageConfirmPage.getSmsOptIn().find(`#appointments-${urlCrn}-${id}-smsOptIn`).click()
    textMessageConfirmPage.getSubmitBtn().click()
    supportingInformationPage = new AppointmentNotePage()
    cy.get(`#appointments-${urlCrn}-${id}-sensitivity-2`).click()
    supportingInformationPage.getSubmitBtn().click()
  }
}
