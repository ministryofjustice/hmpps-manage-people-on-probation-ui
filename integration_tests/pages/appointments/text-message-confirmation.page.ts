import Page from '../page'

export default class TextMessageConfirmationPage extends Page {
  constructor() {
    super('Text message confirmation')
  }

  getSmsOptIn = () => {
    return cy.get(`[data-qa="smsOptIn"]`)
  }

  getSmsPreview = () => {
    return cy.get(`[data-qa="smsPreview"]`)
  }

  getPreviewReveal = () => {
    return cy.get('[data-qa="generate-reveal"]')
  }
}
