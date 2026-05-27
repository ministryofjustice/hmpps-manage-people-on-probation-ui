import AppointmentSentencePage from '../../../pages/appointments/sentence.page'
import { crn, uuid } from '../imports/common'

export const completeSentencePage = ({
  loadPage = true,
  eventIndex = 1,
  query = '',
  crnOverride = '',
  uuidOverride = '',
} = {}) => {
  if (loadPage) {
    cy.visit(`/case/${crnOverride || crn}/arrange-appointment/${uuidOverride || uuid}/sentence${query}`, {
      failOnStatusCode: false,
    })
  }
  const sentencePage = new AppointmentSentencePage()
  const suffix = eventIndex !== 1 ? `-${eventIndex}` : ''
  sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuidOverride || uuid}-eventId${suffix}`).click()
  if (eventIndex === 3 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuidOverride || uuid}-nsiId`).click()
  }
  sentencePage.getSubmitBtn().click()
}
