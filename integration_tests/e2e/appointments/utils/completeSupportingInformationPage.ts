import AppointmentNotePage from '../../../pages/appointments/note.page'
import { crn, uuid } from '../imports/common'

export const completeSupportingInformationPage = ({ notes = true, crnOverride = '', uuidOveride = '' } = {}) => {
  const notePage = new AppointmentNotePage()
  cy.get('form').then(form => form[0].reset())
  if (notes) {
    notePage
      .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-notes`)
      .focus()
      .type('Some notes')
  }
  notePage.getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-sensitivity`).click()
  notePage.getSubmitBtn().click()
}
