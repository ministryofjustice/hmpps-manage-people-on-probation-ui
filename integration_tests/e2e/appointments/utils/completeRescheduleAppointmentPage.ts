import { getUuid } from './common'
import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../pages/appointments/reschedule-appointment.page'

export const completeRescheduleAppointmentPage = (enableNonCompliance = false, crn = 'X000001') => {
  cy.visit(`/case/${crn}/appointments/appointment/6/manage`)
  const manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getAppointmentDetailsRowActions('dateTimeRow').find('a').click()
  getUuid(1).then(pageUuid => {
    const rescheduleAppointmentPage = new RescheduleAppointmentPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage
      .getElement(`#appointments-${crn}-${pageUuid}-rescheduleAppointment-reason`)
      .clear()
      .type('Reschedule reason')
    cy.get('[data-qa="sensitiveInformation"]').find('.govuk-radios__item').eq(1).find('.govuk-radios__input').click()
    rescheduleAppointmentPage.getSubmitBtn().click()
  })
}
