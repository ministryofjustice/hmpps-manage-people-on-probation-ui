import Page, { PageElement } from '../page'

export default class OutcomePage extends Page {
  getCancelAndGoBckBtn = (): PageElement => cy.get('[data-qa="formAnchorLink"]')
}
