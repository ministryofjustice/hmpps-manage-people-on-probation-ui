import Page, { PageElement } from '../page'

export default class TakeAPhotoPage extends Page {
  constructor() {
    super('Take a photo of Caroline')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]').should('have.attr', 'data-camera-ready', 'true')
}
