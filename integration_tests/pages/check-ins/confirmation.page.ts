import Page from '../page'

export default class CheckinConfirmationPage extends Page {
  constructor() {
    super(`Online check ins added`)
  }

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
}
