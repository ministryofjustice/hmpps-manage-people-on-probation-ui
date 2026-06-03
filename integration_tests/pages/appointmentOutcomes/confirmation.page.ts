import Page from '../page'

export default class ConfirmationOutcomePage extends Page {
  getPanel = () => {
    return cy.get(`.govuk-panel`)
  }

  getType = () => {
    return cy.get('.govuk-panel').find('strong')
  }

  getDate = () => {
    return cy.get('.govuk-panel').find('span')
  }

  getWhatHappensNextText = () => {
    return cy.get('[data-qa="what-happens-next"]').find('p')
  }

  getFurtherAction = () => {
    return cy.get('[data-qa="further-actions"]')
  }

  getFurtherActionLinks = () => {
    return cy.get('[data-qa="further-actions"]').find('a')
  }
}
