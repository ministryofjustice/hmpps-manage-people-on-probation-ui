import { DateTime } from 'luxon'
import AddNotePage from '../../../pages/appointments/add-note.page'
import AttendedCompliedPage from '../../../pages/appointments/attended-complied.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import AppointmentNotePage from '../../../pages/appointments/note.page'
import TextMessageConfirmationPage from '../../../pages/appointments/text-message-confirmation.page'

export const completeRescheduling = (id: string, inPast = false) => {
  const urlCrn = 'X000001'
  const dateTimePage = new AppointmentLocationDateTimePage()
  const rescheduledStartTime = '09:10'
  const rescheduledEndTime = '10:30'
  let attendedCompliedPage: AttendedCompliedPage
  let addNotePage: AddNotePage
  let supportingInformationPage: AppointmentNotePage
  let textMessageConfirmPage: TextMessageConfirmationPage
  const future = DateTime.now().plus({ days: 2 })
  const yesterday = DateTime.now().minus({ days: 1 })
  const appointmentDate = inPast ? yesterday : future
  dateTimePage.getDatePickerInput().clear().type(appointmentDate.toFormat('d/M/yyyy'))
  if (inPast) {
    dateTimePage.getLogOutcomesAlertBanner().should('be.visible')
  }
  dateTimePage.getElementInput(`startTime`).type(rescheduledStartTime)
  dateTimePage.getElementInput(`endTime`).focus().type(rescheduledEndTime)
  dateTimePage.getSubmitBtn().click()
  dateTimePage.getSubmitBtn().click()
  if (inPast) {
    attendedCompliedPage = new AttendedCompliedPage()
    attendedCompliedPage.getLogOutcomesAlertBanner().should('be.visible')
    cy.get('.govuk-checkboxes__input').click()
    attendedCompliedPage.getSubmitBtn().click()
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
