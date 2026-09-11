import { DateTime } from 'luxon'
import AddNotePage from '../../../pages/appointments/add-note.page'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import TextMessageConfirmationPage from '../../../pages/appointments/text-message-confirmation.page'
import { completeOutcome } from './completeOutcome'

export const completeRescheduling = ({ id = '', inPast = false } = {}) => {
  const urlCrn = 'X000001'
  const dateTimePage = new AppointmentLocationDateTimePage()
  const rescheduledStartTime = '09:10'
  const rescheduledEndTime = '10:30'
  let addNotePage: AddNotePage
  let textMessageConfirmPage: TextMessageConfirmationPage
  const future = DateTime.now().plus({ days: 2 })
  const yesterday = DateTime.now().minus({ days: 1 })
  const appointmentDate = inPast ? yesterday : future
  dateTimePage.getDatePickerInput().clear().type(appointmentDate.toFormat('d/M/yyyy'))
  dateTimePage.getElementInput(`startTime`).clear().type(rescheduledStartTime)
  dateTimePage.getElementInput(`endTime`).focus().clear().type(rescheduledEndTime)
  dateTimePage.getSubmitBtn().click()
  dateTimePage.getSubmitBtn().click()
  if (inPast) {
    completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
    addNotePage = new AddNotePage()
    cy.get(`#appointments-${urlCrn}-${id}-sensitivity-2`).click()
    addNotePage.getSubmitBtn().click()
  }
  if (!inPast) {
    textMessageConfirmPage = new TextMessageConfirmationPage()
    textMessageConfirmPage.getSmsOptIn().find(`#appointments-${urlCrn}-${id}-smsOptIn`).click()
    textMessageConfirmPage.getSubmitBtn().click()
  }
}
