import Page, { PageElement } from './page'

export default class TechnicalUpdatesPage extends Page {
  constructor() {
    super(`What’s new`)
  }

  sendFeedback = (): PageElement => cy.get('[data-qa-link="send-feedback"]')

  captionText = (): PageElement => cy.get('.govuk-caption-xl')

  headingText = (): PageElement => cy.get('.govuk-heading-xl')

  technicalUpdatesBanner = (): PageElement => cy.get(`#technical-updates-banner`)
}
