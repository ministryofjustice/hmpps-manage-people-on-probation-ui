import { getUuid } from './common'
import ManageAppointmentPage from '../../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../../pages/appointments/reschedule-appointment.page'

export const completeRescheduleAppointmentPage = ({ enableNonCompliance = true, crn = 'X000001' } = {}) => {
  if (!enableNonCompliance) {
    cy.task('stubDisableNonCompliance')
  }
  cy.visit(`/case/${crn}/appointments/appointment/6/manage`)
  const manageAppointmentPage = new ManageAppointmentPage()
  const index = enableNonCompliance ? 2 : 1
  manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').find('a').click()
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
