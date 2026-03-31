import { DateTime } from 'luxon'
import AppointmentSentencePage from '../../../pages/appointments/sentence.page'
import { crn, uuid } from '../imports/common'

export const completeSentencePage = (eventIndex = 1, query = '', crnOverride = '') => {
  const now = DateTime.now().set({
    hour: 9,
    minute: 30,
    second: 0,
    millisecond: 0,
  })
  cy.clock(now.toMillis())
  cy.visit(`/case/${crnOverride || crn}/arrange-appointment/${uuid}/sentence${query}`, { failOnStatusCode: false })
  const sentencePage = new AppointmentSentencePage()
  const suffix = eventIndex !== 1 ? `-${eventIndex}` : ''
  sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-eventId${suffix}`).click()
  if (eventIndex === 3 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-nsiId`).click()
  }
  sentencePage.getSubmitBtn().click()
}
