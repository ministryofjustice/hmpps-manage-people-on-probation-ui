import { getUuid } from './common'
import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../pages/appointments/reschedule-appointment.page'

export const completeRescheduleAppointmentPage = () => {
  cy.visit('/case/X000001/appointments/appointment/6/manage')
  const manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getAppointmentDetailsListItem(2, 'actions').find('a').click()
  getUuid(1).then(pageUuid => {
    const rescheduleAppointmentPage = new RescheduleAppointmentPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage
      .getElement(`#appointments-X000001-${pageUuid}-rescheduleAppointment-reason`)
      .clear()
      .type('Reschedule reason')
    cy.get('[data-qa="sensitiveInformation"]').find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    rescheduleAppointmentPage.getSubmitBtn().click()
  })
}
