import Page from '../page'

export default class AppointmentConfirmationPage extends Page {
  getPanel = () => {
    return cy.get(`.govuk-panel`)
  }

  getWhatHappensNext = () => {
    return cy.get(`[data-qa="what-happens-next"]`)
  }

  getPopContactNumber = () => {
    return cy.get(`[data-qa="popContactNumber"]`)
  }

  getPopTelephone = () => {
    return cy.get(`[data-qa="telephone"]`)
  }

  getPopMobile = () => {
    return cy.get(`[data-qa="mobile"]`)
  }

  getlogOutcomeLink = () => {
    return cy.get(`[data-qa="logOutcomeLink"]`)
  }
}
